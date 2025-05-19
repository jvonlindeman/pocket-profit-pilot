
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface CacheRequest {
  source: string;
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}

interface CacheStatus {
  isCached: boolean;
  isPartial: boolean;
  segmentsFound: number;
  missingStartDate: string | null;
  missingEndDate: string | null;
}

serve(async (req: Request) => {
  console.log(`Cache manager function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CacheRequest = await req.json();
    const { source, startDate, endDate, forceRefresh = false } = requestData;
    
    console.log(`Cache request for ${source} data from ${startDate} to ${endDate}, forceRefresh: ${forceRefresh}`);
    
    // Generate a unique request ID
    const requestId = crypto.randomUUID();
    
    // Get user agent for tracking
    const userAgent = req.headers.get("user-agent") || "";
    
    // Start timing the operation
    const startTime = Date.now();
    
    // If force refresh is requested, we skip cache
    if (forceRefresh) {
      console.log("Force refresh requested, skipping cache check");
      
      // Log cache metrics
      await supabase.from("cache_metrics").insert({
        source,
        start_date: startDate,
        end_date: endDate,
        cache_hit: false,
        partial_hit: false,
        refresh_triggered: true,
        request_id: requestId,
        user_agent: userAgent
      });
      
      // Fetch the data from the appropriate source - we'll invoke the respective function
      let functionName: string;
      switch (source.toLowerCase()) {
        case 'zoho':
          functionName = "zoho-transactions";
          break;
        case 'stripe':
          functionName = "stripe-balance";
          break;
        default:
          throw new Error(`Unknown data source: ${source}`);
      }
      
      // Call the appropriate function to get fresh data
      console.log(`Calling ${functionName} to get fresh data`);
      const { data: freshData, error: functionError } = await supabase.functions.invoke(
        functionName,
        {
          body: {
            startDate,
            endDate,
            forceRefresh: true
          }
        }
      );
      
      if (functionError) {
        console.error(`Error calling ${functionName}:`, functionError);
        throw new Error(`Failed to fetch fresh data: ${functionError.message}`);
      }
      
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // Store the transactions in the cache
      if (freshData && freshData.transactions) {
        // Insert new cache segment
        const { data: segmentData, error: segmentError } = await supabase
          .from('cache_segments')
          .insert({
            source,
            start_date: startDate,
            end_date: endDate,
            transaction_count: freshData.transactions.length,
            status: 'complete',
            last_refreshed_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (segmentError) {
          console.error("Error creating cache segment:", segmentError);
          throw new Error(`Failed to create cache segment: ${segmentError.message}`);
        }
        
        // Only store transactions if we have any
        if (freshData.transactions.length > 0) {
          // Format transactions for storage
          const formattedTransactions = freshData.transactions.map((t: any) => ({
            external_id: t.id,
            date: t.date.split('T')[0],
            amount: t.amount,
            description: t.description,
            category: t.category || null,
            type: t.type,
            source: t.source,
            fees: t.fees || null,
            gross: t.gross || null,
            metadata: t.metadata || {},
            fetched_at: new Date().toISOString()
          }));
          
          // Store transactions in batches
          const batchSize = 100;
          let storageSuccess = true;
          
          for (let i = 0; i < formattedTransactions.length; i += batchSize) {
            const batch = formattedTransactions.slice(i, i + batchSize);
            const { error: batchError } = await supabase
              .from('cached_transactions')
              .upsert(batch, { 
                onConflict: 'source,external_id',
                ignoreDuplicates: true
              });
              
            if (batchError) {
              console.error(`Error storing batch ${i/batchSize + 1}:`, batchError);
              storageSuccess = false;
              
              // Update segment to partial if we had an error
              await supabase
                .from('cache_segments')
                .update({
                  status: 'partial',
                  transaction_count: i
                })
                .eq('id', segmentData.id);
                
              break;
            }
          }
          
          // Update cache metrics with success and transaction count
          await supabase
            .from('cache_metrics')
            .update({
              transaction_count: freshData.transactions.length,
              fetch_duration_ms: duration
            })
            .eq('request_id', requestId);
            
          // Return the fresh data
          return new Response(
            JSON.stringify({
              cached: false,
              success: storageSuccess,
              data: freshData.transactions,
              status: "refreshed",
              metrics: {
                source,
                startDate,
                endDate,
                transactionCount: freshData.transactions.length,
                fetchDuration: duration,
                cacheHit: false
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      }
      
      // If we got here, we didn't have any transactions to store
      return new Response(
        JSON.stringify({
          cached: false,
          status: "refresh_requested",
          success: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if we have this date range cached
    const { data: cacheStatus, error: cacheCheckError } = await supabase.rpc(
      "is_date_range_cached",
      {
        p_source: source,
        p_start_date: startDate,
        p_end_date: endDate
      }
    );
    
    if (cacheCheckError) {
      console.error("Error checking cache status:", cacheCheckError);
      throw new Error(`Cache check failed: ${cacheCheckError.message}`);
    }
    
    console.log("Cache status:", cacheStatus);
    
    // Extract cache status
    const { is_cached, is_partial, segments_found, missing_start_date, missing_end_date } = cacheStatus[0] as {
      is_cached: boolean,
      is_partial: boolean,
      segments_found: number,
      missing_start_date: string | null,
      missing_end_date: string | null
    };
    
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Log cache metrics
    await supabase.from("cache_metrics").insert({
      source,
      start_date: startDate,
      end_date: endDate,
      cache_hit: is_cached,
      partial_hit: is_partial,
      refresh_triggered: false,
      fetch_duration_ms: duration,
      request_id: requestId,
      user_agent: userAgent
    });
    
    // If we have a full cache hit, get the transactions
    if (is_cached && !is_partial) {
      console.log(`Complete cache hit for ${source} from ${startDate} to ${endDate}`);
      
      // Fetch the cached transactions
      const { data: transactions, error: fetchError } = await supabase
        .from("cached_transactions")
        .select("*")
        .eq("source", source)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      
      if (fetchError) {
        console.error("Error fetching cached transactions:", fetchError);
        throw new Error(`Transaction fetch failed: ${fetchError.message}`);
      }
      
      // Update the metrics with transaction count
      await supabase
        .from("cache_metrics")
        .update({ transaction_count: transactions.length })
        .eq("request_id", requestId);
      
      return new Response(
        JSON.stringify({
          cached: true,
          data: transactions,
          status: "complete",
          metrics: {
            source,
            startDate,
            endDate,
            transactionCount: transactions.length,
            fetchDuration: duration,
            cacheHit: true,
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // For partial or no cache, return the cache status
    return new Response(
      JSON.stringify({
        cached: false,
        partial: is_partial,
        status: is_partial ? "partial" : "miss",
        segments: segments_found,
        missingRanges: {
          startDate: missing_start_date,
          endDate: missing_end_date
        },
        metrics: {
          source,
          startDate,
          endDate,
          duration,
          cacheHit: false,
          partialHit: is_partial
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in cache-manager function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Cache manager error", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
