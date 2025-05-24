
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
    
    let semanticSearchResults = null
    let searchContext = ''

    // If this is a semantic search query, perform the search
    if (isSemanticSearchQuery) {
      console.log('Detected semantic search query:', userMessage)
      
      try {
        semanticSearchResults = await performSemanticSearch(
          userMessage,
          dateRange,
          openaiApiKey,
          supabase
        )
        
        if (semanticSearchResults && semanticSearchResults.length > 0) {
          searchContext = formatSearchResults(semanticSearchResults)
          console.log(`Found ${semanticSearchResults.length} semantically similar transactions`)
        }
      } catch (error) {
        console.error('Semantic search failed:', error)
        // Continue with regular analysis if semantic search fails
      }
    }

    // Build the system prompt with enhanced context
    const systemPrompt = buildSystemPrompt(uiData, conversationContext, searchContext)

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter((msg: Message) => msg.role !== 'system')
    ]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000,
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

    // If we performed a semantic search, also generate embeddings for new transactions
    if (isSemanticSearchQuery) {
      await generateMissingEmbeddings(supabase, openaiApiKey)
    }

    return new Response(
      JSON.stringify({
        response: { content: assistantResponse },
        searchResults: semanticSearchResults,
        searchPerformed: isSemanticSearchQuery
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

function formatSearchResults(results: SemanticSearchResult[]): string {
  if (!results || results.length === 0) {
    return 'No se encontraron transacciones similares.'
  }

  let formatted = `\n=== RESULTADOS DE BÚSQUEDA SEMÁNTICA (${results.length} encontradas) ===\n`
  
  results.forEach((result, index) => {
    const similarity = Math.round(result.similarity * 100)
    formatted += `\n${index + 1}. ${result.description}`
    formatted += `\n   Monto: $${Number(result.amount).toLocaleString()}`
    formatted += `\n   Fecha: ${result.date}`
    formatted += `\n   Categoría: ${result.category || 'Sin categoría'}`
    formatted += `\n   Similitud: ${similarity}%`
    formatted += `\n   Fuente: ${result.source}`
    formatted += `\n`
  })
  
  formatted += `\n=== FIN DE RESULTADOS ===\n`
  return formatted
}

function buildSystemPrompt(uiData: any, conversationContext: any, searchContext: string): string {
  const basePrompt = `Eres un asistente financiero especializado con acceso completo a datos financieros históricos y capacidades de búsqueda semántica avanzada.

CAPACIDADES PRINCIPALES:
1. Análisis financiero detallado y tendencias históricas
2. Búsqueda semántica inteligente de transacciones por descripción
3. Identificación de patrones de gasto y comportamiento financiero
4. Comparaciones temporales y análisis de variaciones

DATOS DISPONIBLES:
- Resumen financiero: ${JSON.stringify(uiData?.summary || {})}
- Transacciones: ${uiData?.transactions?.length || 0} registros
- Gastos colaboradores: ${uiData?.collaboratorExpenses?.length || 0} registros
- Ingresos regulares: $${uiData?.regularIncome || 0}
- Rango de fechas: ${uiData?.dateRange?.startDate} a ${uiData?.dateRange?.endDate}
- Facturas pendientes: ${uiData?.unpaidInvoices?.length || 0}

${searchContext ? `RESULTADOS DE BÚSQUEDA SEMÁNTICA:
${searchContext}

INSTRUCCIONES PARA BÚSQUEDA SEMÁNTICA:
- Analiza los resultados encontrados y proporciona insights relevantes
- Explica patrones en las transacciones similares encontradas
- Destaca las similitudes y diferencias importantes
- Sugiere acciones o análisis adicionales basados en los resultados
` : ''}

INSTRUCCIONES:
- Responde en español de manera profesional y clara
- Usa los datos específicos disponibles para tus análisis
- Proporciona insights accionables y relevantes
- Si realizaste una búsqueda semántica, enfócate en analizar esos resultados específicos
- Mantén el contexto de conversaciones anteriores cuando sea relevante
- Sé preciso con números y fechas

CONTEXTO CONVERSACIONAL:
${conversationContext?.sharedInsights?.length ? `Insights previos: ${conversationContext.sharedInsights.slice(-3).join('; ')}` : ''}
${conversationContext?.previousQueries?.length ? `Consultas recientes: ${conversationContext.previousQueries.slice(-2).map((q: any) => q.query).join('; ')}` : ''}`

  return basePrompt
}

async function generateMissingEmbeddings(supabase: any, openaiApiKey: string): Promise<void> {
  try {
    // Get transactions without embeddings (limit to recent ones to avoid overwhelming the API)
    const { data: transactions, error } = await supabase
      .from('cached_transactions')
      .select('id, description')
      .is('description_embedding', null)
      .not('description', 'is', null)
      .limit(20) // Process in small batches

    if (error || !transactions || transactions.length === 0) {
      return
    }

    console.log(`Generating embeddings for ${transactions.length} transactions`)

    // Generate embeddings in batches to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      
      try {
        const embeddingPromises = batch.map(async (transaction) => {
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

            // Update the transaction with its embedding
            await supabase.rpc('update_transaction_embedding', {
              transaction_id: transaction.id,
              embedding: embedding
            })
          }
        })

        await Promise.all(embeddingPromises)
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (batchError) {
        console.error(`Error processing embedding batch ${i}-${i + batchSize}:`, batchError)
      }
    }
  } catch (error) {
    console.error('Error generating missing embeddings:', error)
  }
}
