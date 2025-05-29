
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { batchSize = 10, forceRegenerate = false } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('GPT_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Get transactions without embeddings or force regenerate all
    const query = supabase
      .from('cached_transactions')
      .select('id, description')
      .not('description', 'is', null)

    if (!forceRegenerate) {
      query.is('description_embedding', null)
    }

    const { data: transactions, error: fetchError } = await query.limit(batchSize)

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError)
      throw new Error(`Database error: ${fetchError.message}`)
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No transactions to process',
          processed: 0,
          total: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${transactions.length} transactions for embeddings`)

    let processed = 0
    let errors = 0

    // Process transactions in smaller batches to respect rate limits
    const embeddingBatchSize = 5
    for (let i = 0; i < transactions.length; i += embeddingBatchSize) {
      const batch = transactions.slice(i, i + embeddingBatchSize)
      
      try {
        const embeddingPromises = batch.map(async (transaction) => {
          try {
            // Generate embedding for the transaction description
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

            if (!embeddingResponse.ok) {
              console.error(`Embedding API error for transaction ${transaction.id}:`, embeddingResponse.status)
              return { success: false, transactionId: transaction.id }
            }

            const embeddingData = await embeddingResponse.json()
            const embedding = embeddingData.data[0].embedding

            // Update the transaction with its embedding
            const { error: updateError } = await supabase.rpc('update_transaction_embedding', {
              transaction_id: transaction.id,
              embedding: embedding
            })

            if (updateError) {
              console.error(`Database update error for transaction ${transaction.id}:`, updateError)
              return { success: false, transactionId: transaction.id }
            }

            return { success: true, transactionId: transaction.id }
          } catch (error) {
            console.error(`Error processing transaction ${transaction.id}:`, error)
            return { success: false, transactionId: transaction.id, error: error.message }
          }
        })

        const results = await Promise.all(embeddingPromises)
        
        // Count successes and failures
        results.forEach(result => {
          if (result.success) {
            processed++
          } else {
            errors++
          }
        })

        // Rate limiting delay between batches
        if (i + embeddingBatchSize < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (batchError) {
        console.error(`Error processing batch ${i}-${i + embeddingBatchSize}:`, batchError)
        errors += batch.length
      }
    }

    // Get total count for progress tracking
    const { count: totalCount } = await supabase
      .from('cached_transactions')
      .select('*', { count: 'exact', head: true })
      .not('description', 'is', null)

    return new Response(
      JSON.stringify({
        message: `Processed ${processed} transactions successfully`,
        processed,
        errors,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > processed + errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-embeddings function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error processing embeddings',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
