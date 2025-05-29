
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SemanticSearchQuery {
  query: string;
  similarityThreshold?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface SemanticSearchResult {
  id: string;
  external_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: string;
  source: string;
  similarity: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, dateRange, uiData, conversationContext } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('GPT_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Analyze user intent to determine if this is a semantic search query
    const userMessage = messages[messages.length - 1]?.content || ''
    const isSemanticSearchQuery = analyzeSearchIntent(userMessage)
    const isTemporalQuery = analyzeTemporalIntent(userMessage)
    
    let semanticSearchResults = null
    let searchContext = ''
    let embeddingStats = null

    // If this is a semantic search query, perform the search
    if (isSemanticSearchQuery) {
      console.log('Detected semantic search query:', userMessage)
      
      try {
        // Check embedding coverage first
        embeddingStats = await checkEmbeddingCoverage(supabase)
        
        if (embeddingStats.coverage < 10) {
          // Very low coverage, inform user
          searchContext = `\n=== ADVERTENCIA DE BÚSQUEDA SEMÁNTICA ===\nSolo ${embeddingStats.coverage}% de las transacciones (${embeddingStats.withEmbeddings}/${embeddingStats.total}) tienen embeddings generados.\nLa búsqueda semántica está muy limitada. Se recomienda generar embeddings para todas las transacciones.\n=== FIN DE ADVERTENCIA ===\n`
        } else {
          semanticSearchResults = await performSemanticSearch(
            userMessage,
            dateRange,
            openaiApiKey,
            supabase
          )
          
          if (semanticSearchResults && semanticSearchResults.length > 0) {
            searchContext = formatSearchResults(semanticSearchResults, embeddingStats)
            console.log(`Found ${semanticSearchResults.length} semantically similar transactions`)
          } else {
            searchContext = `\n=== BÚSQUEDA SEMÁNTICA ===\nNo se encontraron transacciones similares para: "${userMessage}"\nCobertura actual: ${embeddingStats.coverage}% (${embeddingStats.withEmbeddings}/${embeddingStats.total} transacciones)\n=== FIN DE BÚSQUEDA ===\n`
          }
        }
      } catch (error) {
        console.error('Semantic search failed:', error)
        searchContext = `\n=== ERROR EN BÚSQUEDA SEMÁNTICA ===\nNo se pudo realizar la búsqueda semántica: ${error.message}\nContinuando con análisis regular.\n=== FIN DE ERROR ===\n`
      }
    }

    // Build the system prompt with enhanced context including historical data
    const systemPrompt = buildEnhancedSystemPrompt(uiData, conversationContext, searchContext, isTemporalQuery, embeddingStats)

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter((msg: Message) => msg.role !== 'system')
    ]

    // Call OpenAI API with optimized model selection
    const model = isSemanticSearchQuery || isTemporalQuery ? 'gpt-4o' : 'gpt-4o-mini'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const openaiData = await response.json()
    const assistantResponse = openaiData.choices[0]?.message?.content

    if (!assistantResponse) {
      throw new Error('No response from OpenAI')
    }

    // Background embedding generation for new transactions (don't await)
    if (isSemanticSearchQuery && embeddingStats && embeddingStats.coverage < 90) {
      generateMissingEmbeddingsBackground(supabase, openaiApiKey).catch(err => 
        console.error('Background embedding generation failed:', err)
      )
    }

    return new Response(
      JSON.stringify({
        response: { content: assistantResponse },
        searchResults: semanticSearchResults,
        searchPerformed: isSemanticSearchQuery,
        embeddingStats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in financial assistant:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error procesando solicitud',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function analyzeSearchIntent(userMessage: string): boolean {
  const searchKeywords = [
    'find', 'search', 'show me', 'look for', 'buscar', 'encontrar', 'mostrar',
    'similar to', 'like', 'parecido', 'similar', 'transactions like',
    'payments for', 'pagos de', 'gastos en', 'compras de',
    'what did i spend on', 'qué gasté en', 'cuánto gasté en'
  ]
  
  const lowerMessage = userMessage.toLowerCase()
  return searchKeywords.some(keyword => lowerMessage.includes(keyword))
}

function analyzeTemporalIntent(userMessage: string): boolean {
  const temporalKeywords = [
    'compare', 'comparison', 'comparar', 'comparación', 'vs', 'versus',
    'month to month', 'mes a mes', 'monthly', 'mensual',
    'trend', 'tendencia', 'pattern', 'patrón', 'over time', 'con el tiempo',
    'last month', 'el mes pasado', 'previous', 'anterior',
    'year to year', 'año a año', 'seasonal', 'estacional',
    'growth', 'crecimiento', 'decline', 'descenso', 'change', 'cambio',
    'history', 'historial', 'historical', 'histórico'
  ]
  
  const lowerMessage = userMessage.toLowerCase()
  return temporalKeywords.some(keyword => lowerMessage.includes(keyword))
}

async function checkEmbeddingCoverage(supabase: any) {
  try {
    // Get total transactions
    const { count: totalCount } = await supabase
      .from('cached_transactions')
      .select('*', { count: 'exact', head: true })
      .not('description', 'is', null)

    // Get transactions with embeddings
    const { count: embeddedCount } = await supabase
      .from('cached_transactions')
      .select('*', { count: 'exact', head: true })
      .not('description_embedding', 'is', null)

    const coverage = totalCount > 0 ? Math.round((embeddedCount / totalCount) * 100) : 0

    return {
      total: totalCount || 0,
      withEmbeddings: embeddedCount || 0,
      coverage
    }
  } catch (error) {
    console.error('Error checking embedding coverage:', error)
    return { total: 0, withEmbeddings: 0, coverage: 0 }
  }
}

async function performSemanticSearch(
  query: string, 
  dateRange: any, 
  openaiApiKey: string, 
  supabase: any
): Promise<SemanticSearchResult[] | null> {
  
  // Generate embedding for the search query
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536
    }),
  })

  if (!embeddingResponse.ok) {
    throw new Error(`Embedding API error: ${embeddingResponse.status}`)
  }

  const embeddingData = await embeddingResponse.json()
  const queryEmbedding = embeddingData.data[0].embedding

  // Perform semantic search using the database function
  const { data: searchResults, error } = await supabase.rpc('search_transactions_semantic', {
    query_embedding: queryEmbedding,
    similarity_threshold: 0.6,
    limit_count: 15,
    p_start_date: dateRange?.startDate ? new Date(dateRange.startDate).toISOString().split('T')[0] : null,
    p_end_date: dateRange?.endDate ? new Date(dateRange.endDate).toISOString().split('T')[0] : null
  })

  if (error) {
    console.error('Semantic search database error:', error)
    throw new Error(`Database search error: ${error.message}`)
  }

  return searchResults || []
}

function formatSearchResults(results: SemanticSearchResult[], embeddingStats: any): string {
  if (!results || results.length === 0) {
    return 'No se encontraron transacciones similares.'
  }

  let formatted = `\n=== RESULTADOS DE BÚSQUEDA SEMÁNTICA (${results.length} encontradas) ===\n`
  formatted += `Cobertura de búsqueda: ${embeddingStats.coverage}% (${embeddingStats.withEmbeddings}/${embeddingStats.total} transacciones indexadas)\n\n`
  
  results.forEach((result, index) => {
    const similarity = Math.round(result.similarity * 100)
    formatted += `${index + 1}. ${result.description}\n`
    formatted += `   Monto: $${Number(result.amount).toLocaleString()}\n`
    formatted += `   Fecha: ${result.date}\n`
    formatted += `   Categoría: ${result.category || 'Sin categoría'}\n`
    formatted += `   Similitud: ${similarity}%\n`
    formatted += `   Fuente: ${result.source}\n\n`
  })
  
  formatted += `=== FIN DE RESULTADOS ===\n`
  return formatted
}

function buildEnhancedSystemPrompt(uiData: any, conversationContext: any, searchContext: string, isTemporalQuery: boolean, embeddingStats: any): string {
  let historicalContext = '';
  let temporalAnalysisInstructions = '';

  // Include historical data if available
  if (uiData?.historicalContext && uiData.temporalAnalysisAvailable) {
    const history = uiData.historicalContext;
    
    historicalContext = `\nDATOS HISTÓRICOS DISPONIBLES:
- Historial mensual: ${history.monthlyHistory?.length || 0} meses de datos
- Período actual: ${history.currentPeriod?.year}-${history.currentPeriod?.month}
- Tendencias generales: Ingresos ${history.trends?.overallIncomesTrend}, Gastos ${history.trends?.overallExpensesTrend}, Beneficio ${history.trends?.overallProfitTrend}
- Volatilidad: ${history.trends?.volatility}%
- Patrones estacionales: Mejor mes de ingresos: ${history.seasonalPatterns?.highestIncomeMonth}, Peor mes: ${history.seasonalPatterns?.lowestIncomeMonth}
- Beneficio mensual promedio: $${history.seasonalPatterns?.averageMonthlyProfit?.toLocaleString() || 0}

HISTORIAL MENSUAL DETALLADO:
${history.monthlyHistory?.map((month: any, index: number) => `
${index + 1}. ${month.year}-${month.month}: 
   Ingresos: $${Number(month.total_income).toLocaleString()} (${month.income_trend || 'stable'})
   Gastos: $${Number(month.total_expense).toLocaleString()} (${month.expense_trend || 'stable'})
   Beneficio: $${Number(month.profit).toLocaleString()} (${month.profit_trend || 'stable'})
   Margen: ${Number(month.profit_margin).toFixed(1)}%
   ${month.mom_income_change ? `Cambio ingresos MoM: ${Number(month.mom_income_change).toFixed(1)}%` : ''}
   ${month.mom_expense_change ? `Cambio gastos MoM: ${Number(month.mom_expense_change).toFixed(1)}%` : ''}
   ${month.mom_profit_change ? `Cambio beneficio MoM: ${Number(month.mom_profit_change).toFixed(1)}%` : ''}
`).join('') || 'No hay datos históricos detallados disponibles.'}`;

    if (isTemporalQuery) {
      temporalAnalysisInstructions = `\nINSTRUCCIONES PARA ANÁLISIS TEMPORAL:
- Utiliza los datos históricos para realizar comparaciones mes a mes
- Identifica tendencias y patrones en los datos
- Proporciona contexto histórico para el período actual
- Calcula cambios porcentuales y variaciones significativas
- Destaca anomalías o desviaciones de patrones históricos
- Sugiere acciones basadas en tendencias identificadas
- Usa los datos de volatilidad para evaluar la estabilidad financiera`;
    }
  } else {
    historicalContext = '\nDATOS HISTÓRICOS: No disponibles (se está generando en segundo plano)';
  }

  // Add embedding status context
  let embeddingContext = '';
  if (embeddingStats) {
    embeddingContext = `\nESTADO DE BÚSQUEDA SEMÁNTICA:
- Cobertura: ${embeddingStats.coverage}% (${embeddingStats.withEmbeddings}/${embeddingStats.total} transacciones indexadas)
- Estado: ${embeddingStats.coverage === 100 ? 'Completo' : embeddingStats.coverage > 80 ? 'Bueno' : embeddingStats.coverage > 50 ? 'Limitado' : 'Muy limitado'}`;
  }

  const basePrompt = `Eres un asistente financiero especializado con acceso completo a datos financieros históricos y capacidades de búsqueda semántica avanzada.

CAPACIDADES PRINCIPALES:
1. Análisis financiero detallado y tendencias históricas
2. Búsqueda semántica inteligente de transacciones por descripción
3. Identificación de patrones de gasto y comportamiento financiero
4. Comparaciones temporales y análisis de variaciones
5. Análisis de tendencias mes a mes con datos históricos reales
6. Detección de patrones estacionales y anomalías

DATOS DISPONIBLES PERÍODO ACTUAL:
- Resumen financiero: ${JSON.stringify(uiData?.summary || {})}
- Transacciones: ${uiData?.transactions?.length || 0} registros
- Gastos colaboradores: ${uiData?.collaboratorExpenses?.length || 0} registros
- Ingresos regulares: $${uiData?.regularIncome || 0}
- Rango de fechas: ${uiData?.dateRange?.startDate} a ${uiData?.dateRange?.endDate}
- Facturas pendientes: ${uiData?.unpaidInvoices?.length || 0}

${historicalContext}

${embeddingContext}

${searchContext ? `RESULTADOS DE BÚSQUEDA SEMÁNTICA:
${searchContext}

INSTRUCCIONES PARA BÚSQUEDA SEMÁNTICA:
- Analiza los resultados encontrados y proporciona insights relevantes
- Explica patrones en las transacciones similares encontradas
- Destaca las similitudes y diferencias importantes
- Sugiere acciones o análisis adicionales basados en los resultados
- Si la cobertura de embeddings es baja, menciona esta limitación
` : ''}

${temporalAnalysisInstructions}

INSTRUCCIONES GENERALES:
- Responde en español de manera profesional y clara
- Usa los datos específicos disponibles para tus análisis
- Proporciona insights accionables y relevantes
- Si realizaste una búsqueda semántica, enfócate en analizar esos resultados específicos
- Para consultas temporales, utiliza los datos históricos para comparaciones reales
- Mantén el contexto de conversaciones anteriores cuando sea relevante
- Sé preciso con números y fechas
- Cuando sea relevante, proporciona comparaciones mes a mes usando datos reales
- Si los embeddings están incompletos, sugiere generar embeddings para mejorar las búsquedas

CONTEXTO CONVERSACIONAL:
${conversationContext?.sharedInsights?.length ? `Insights previos: ${conversationContext.sharedInsights.slice(-3).join('; ')}` : ''}
${conversationContext?.previousQueries?.length ? `Consultas recientes: ${conversationContext.previousQueries.slice(-2).map((q: any) => q.query).join('; ')}` : ''}`

  return basePrompt
}

async function generateMissingEmbeddingsBackground(supabase: any, openaiApiKey: string): Promise<void> {
  try {
    console.log('Starting background embedding generation...')
    
    // Get a small batch of transactions without embeddings
    const { data: transactions, error } = await supabase
      .from('cached_transactions')
      .select('id, description')
      .is('description_embedding', null)
      .not('description', 'is', null)
      .limit(5) // Small batch for background processing

    if (error || !transactions || transactions.length === 0) {
      return
    }

    console.log(`Background: generating embeddings for ${transactions.length} transactions`)

    for (const transaction of transactions) {
      try {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: transaction.description,
            dimensions: 1536
          }),
        })

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json()
          const embedding = embeddingData.data[0].embedding

          await supabase.rpc('update_transaction_embedding', {
            transaction_id: transaction.id,
            embedding: embedding
          })
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        console.error(`Background embedding error for transaction ${transaction.id}:`, err)
      }
    }
  } catch (error) {
    console.error('Error in background embedding generation:', error)
  }
}
