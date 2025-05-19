
// Follow this setup guide to integrate the Supabase client library in your Edge Function
// https://supabase.com/docs/guides/functions/edge-functions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Handle only POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed', 
        message: 'Only POST requests are allowed' 
      }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Parse request body
    const requestData = await req.json()
    const { source, startDate, endDate, forceRefresh = false } = requestData

    // Validate required parameters
    if (!source || !startDate || !endDate) {
      return new Response(JSON.stringify({ 
        error: 'Bad request', 
        message: 'Missing required parameters: source, startDate, endDate' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log(`Cache manager function called with method: ${req.method}`)
    console.log(`Cache request for ${source} data from ${startDate} to ${endDate}, forceRefresh: ${forceRefresh}`)

    // Check if we're dealing with a monthly request (first day of month to last day)
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const startYear = startDateObj.getFullYear()
    const startMonth = startDateObj.getMonth() + 1 // JavaScript months are 0-indexed
    const isFirstDayOfMonth = startDateObj.getDate() === 1
    
    // Check if end date is last day of month
    const lastDayOfMonth = new Date(startYear, startMonth, 0).getDate()
    const isLastDayOfMonth = endDateObj.getDate() === lastDayOfMonth
    
    // Check if exactly one month range
    const isSameYearMonth = 
      startDateObj.getFullYear() === endDateObj.getFullYear() &&
      startDateObj.getMonth() === endDateObj.getMonth()
    
    const isExactlyOneMonth = isSameYearMonth && isFirstDayOfMonth && isLastDayOfMonth

    // If it's a monthly request, use the new approach
    if (isExactlyOneMonth || forceRefresh) {
      try {
        // Check if the month is cached using new function
        const { data: monthCached, error: monthError } = await supabaseClient
          .rpc('is_month_cached', {
            p_source: source,
            p_year: startYear,
            p_month: startMonth
          })
          
        if (monthError) {
          throw new Error(`Error checking monthly cache: ${monthError.message}`)
        }
        
        if (monthCached && monthCached.length > 0 && monthCached[0].is_cached && !forceRefresh) {
          // Month is cached, return the transactions
          const { data: transactions, error: txError } = await supabaseClient
            .from('cached_transactions')
            .select('*')
            .eq('source', source)
            .eq('year', startYear)
            .eq('month', startMonth)

          if (txError) {
            throw new Error(`Error fetching cached transactions: ${txError.message}`)
          }

          console.log(`Complete cache hit for ${source} from ${startDate} to ${endDate}`)
          
          // Return cache hit response with transactions
          return new Response(JSON.stringify({
            cached: true,
            status: 'complete',
            data: transactions,
            partial: false,
            metrics: {
              source,
              startDate,
              endDate,
              transactionCount: transactions?.length || 0,
              cacheHit: true,
              partialHit: false
            }
          }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        } else {
          // Month is not cached
          console.log(`Cache miss for ${source} from ${startDate} to ${endDate}`)

          // Use the request ID from the header if available, for tracking
          const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

          // Record the cache miss or refresh request
          await supabaseClient
            .from('cache_metrics')
            .insert({
              source,
              start_date: startDate,
              end_date: endDate,
              cache_hit: false,
              partial_hit: false,
              refresh_triggered: forceRefresh,
              request_id: requestId,
              user_agent: req.headers.get('user-agent')
            })

          // Return cache miss response
          return new Response(JSON.stringify({
            cached: false,
            status: forceRefresh ? 'force_refresh' : 'missing',
            partial: false,
            missingRanges: {
              startDate,
              endDate
            },
            metrics: {
              source,
              startDate,
              endDate,
              cacheHit: false,
              partialHit: false
            }
          }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }
      } catch (error: any) {
        console.error(`Error checking cache status: ${error}`)
        throw new Error(`Cache check failed: ${error.message}`)
      }
    } else {
      // For more complex date ranges, we need to check if multiple months are cached
      // Extract all months in the date range
      const months: { year: number, month: number }[] = []
      let currentDate = new Date(startDateObj)
      
      while (currentDate <= endDateObj) {
        months.push({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1
        })
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
      
      // Check if all months in range are cached
      let allCached = true
      let transactionCount = 0
      
      for (const { year, month } of months) {
        const { data: monthCached, error: monthError } = await supabaseClient
          .rpc('is_month_cached', {
            p_source: source,
            p_year: year,
            p_month: month
          })
          
        if (monthError || !monthCached || monthCached.length === 0 || !monthCached[0].is_cached) {
          allCached = false
          break
        }
        
        transactionCount += monthCached[0].transaction_count || 0
      }
      
      if (allCached && !forceRefresh) {
        // All months in range are cached, fetch all transactions
        const { data: transactions, error: txError } = await supabaseClient
          .from('cached_transactions')
          .select('*')
          .eq('source', source)
          .gte('date', startDate)
          .lte('date', endDate)

        if (txError) {
          throw new Error(`Error fetching cached transactions: ${txError.message}`)
        }

        console.log(`Complete cache hit for ${source} from ${startDate} to ${endDate}`)
        
        // Return cache hit response with transactions
        return new Response(JSON.stringify({
          cached: true,
          status: 'complete',
          data: transactions,
          partial: false,
          metrics: {
            source,
            startDate,
            endDate,
            transactionCount: transactions?.length || 0,
            cacheHit: true,
            partialHit: false
          }
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      } else {
        // Not all months are cached
        console.log(`Cache miss or force refresh for ${source} from ${startDate} to ${endDate}`)

        // Record the cache miss or refresh request
        const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
        await supabaseClient
          .from('cache_metrics')
          .insert({
            source,
            start_date: startDate,
            end_date: endDate,
            cache_hit: false,
            partial_hit: false,
            refresh_triggered: forceRefresh,
            request_id: requestId,
            user_agent: req.headers.get('user-agent')
          })

        // Return cache miss response
        return new Response(JSON.stringify({
          cached: false,
          status: forceRefresh ? 'force_refresh' : 'missing',
          partial: false,
          missingRanges: {
            startDate,
            endDate
          },
          metrics: {
            source,
            startDate,
            endDate,
            cacheHit: false,
            partialHit: false
          }
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
    }
  } catch (error: any) {
    console.error(`Error in cache-manager function: ${error}`)
    
    return new Response(JSON.stringify({
      error: error.message,
      cached: false,
      status: 'error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
