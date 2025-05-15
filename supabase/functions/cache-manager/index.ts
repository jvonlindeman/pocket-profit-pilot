
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

interface CacheSegment {
  source: string;
  start_date: string;
  end_date: string;
  transaction_count: number;
  last_refreshed_at: string;
  status: string;
}

/**
 * Enhanced function to detect whether segments fully cover a date range
 */
async function checkIfDateRangeCovered(source: string, startDate: string, endDate: string): Promise<{
  covered: boolean;
  segments: CacheSegment[];
  partial: boolean;
  missingRanges: { startDate: string | null; endDate: string | null }[];
}> {
  try {
    // Get all segments for this source that might overlap with the requested range
    const { data: segments, error } = await supabase
      .from('cache_segments')
      .select('*')
      .eq('source', source)
      .eq('status', 'complete')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
    
    if (error) {
      console.error("Error checking segments:", error);
      return { covered: false, segments: [], partial: false, missingRanges: [{ startDate, endDate }] };
    }
    
    if (!segments || segments.length === 0) {
      console.log(`No cache segments found for ${source} from ${startDate} to ${endDate}`);
      return { covered: false, segments: [], partial: false, missingRanges: [{ startDate, endDate }] };
    }
    
    // Case: Check for exact match first
    const exactMatch = segments.find(segment => 
      segment.start_date <= startDate && 
      segment.end_date >= endDate
    );
    
    if (exactMatch) {
      console.log(`Found exact match segment covering ${startDate} to ${endDate}`);
      return { covered: true, segments: [exactMatch], partial: false, missingRanges: [] };
    }
    
    // Case: Check if multiple segments collectively cover the range
    // First sort segments by start_date
    const sortedSegments = [...segments].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    // Now check if they form continuous coverage
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    const missingRanges: { startDate: string | null; endDate: string | null }[] = [];
    
    for (let i = 0; i < sortedSegments.length; i++) {
      const segment = sortedSegments[i];
      const segmentStart = new Date(segment.start_date);
      const segmentEnd = new Date(segment.end_date);
      
      // If there's a gap before this segment
      if (currentDate < segmentStart) {
        missingRanges.push({
          startDate: currentDate.toISOString().split('T')[0],
          endDate: new Date(segmentStart.getTime() - 86400000).toISOString().split('T')[0] // day before segment start
        });
      }
      
      // Move currentDate to the day after this segment ends
      const nextDate = new Date(segmentEnd.getTime() + 86400000);
      if (nextDate > currentDate) {
        currentDate = nextDate;
      }
      
      // If we've passed the end date, we're done
      if (currentDate > endDateObj) {
        break;
      }
    }
    
    // If we haven't reached the end date, there's a gap at the end
    if (currentDate <= endDateObj) {
      missingRanges.push({
        startDate: currentDate.toISOString().split('T')[0],
        endDate: endDate
      });
    }
    
    const covered = missingRanges.length === 0;
    const partial = !covered && missingRanges.length > 0;
    
    console.log(`Date range check: Covered: ${covered}, Partial: ${partial}, Missing ranges: ${JSON.stringify(missingRanges)}`);
    
    return { covered, segments: sortedSegments, partial, missingRanges };
  } catch (err) {
    console.error("Error in checkIfDateRangeCovered:", err);
    return { covered: false, segments: [], partial: false, missingRanges: [{ startDate, endDate }] };
  }
}

async function getTransactionsFromCache(source: string, startDate: string, endDate: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('cached_transactions')
      .select('*')
      .eq('source', source)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) {
      console.error("Error fetching transactions from cache:", error);
      return [];
    }
    
    // Add fromCache flag to each transaction
    return (data || []).map(tx => ({
      ...tx,
      fromCache: true
    }));
  } catch (err) {
    console.error("Error in getTransactionsFromCache:", err);
    return [];
  }
}

// Main function for handling requests
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const cacheRequest: CacheRequest = await req.json();
    const { source, startDate, endDate, forceRefresh = false } = cacheRequest;
    
    console.log(`Cache-manager request: ${source} from ${startDate} to ${endDate}, forceRefresh: ${forceRefresh}`);
    
    // If force refresh is requested, skip cache check
    if (forceRefresh) {
      return new Response(
        JSON.stringify({ 
          cached: false, 
          status: "force_refresh_requested",
          metrics: {
            source,
            startDate,
            endDate,
            cacheHit: false
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if the date range is covered by cache
    const coverage = await checkIfDateRangeCovered(source, startDate, endDate);
    
    // If fully covered, get data from cache
    if (coverage.covered) {
      console.log(`${source} data from ${startDate} to ${endDate} is fully cached`);
      
      const transactions = await getTransactionsFromCache(source, startDate, endDate);
      console.log(`Retrieved ${transactions.length} transactions from cache`);
      
      // Log cache hit metrics
      try {
        await supabase.from('cache_metrics').insert({
          source,
          start_date: startDate,
          end_date: endDate,
          cache_hit: true,
          partial_hit: false,
          transaction_count: transactions.length,
          refresh_triggered: false
        });
      } catch (metricsError) {
        console.error("Error logging cache metrics:", metricsError);
      }
      
      return new Response(
        JSON.stringify({
          cached: true,
          status: "complete",
          data: transactions,
          metrics: {
            source,
            startDate,
            endDate,
            transactionCount: transactions.length,
            cacheHit: true,
            partialHit: false
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If partially covered, return that info
    if (coverage.partial) {
      console.log(`${source} data from ${startDate} to ${endDate} is partially cached`);
      
      // Get the cached portion
      const transactions = await getTransactionsFromCache(source, startDate, endDate);
      console.log(`Retrieved ${transactions.length} transactions from partial cache`);
      
      // Log cache partial hit metrics
      try {
        await supabase.from('cache_metrics').insert({
          source,
          start_date: startDate,
          end_date: endDate,
          cache_hit: true,
          partial_hit: true,
          transaction_count: transactions.length,
          refresh_triggered: true
        });
      } catch (metricsError) {
        console.error("Error logging cache metrics:", metricsError);
      }
      
      return new Response(
        JSON.stringify({
          cached: true,
          status: "partial",
          data: transactions,
          partial: true,
          missingRanges: coverage.missingRanges,
          metrics: {
            source,
            startDate,
            endDate,
            transactionCount: transactions.length,
            cacheHit: true,
            partialHit: true
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Not cached
    console.log(`${source} data from ${startDate} to ${endDate} is not cached`);
    
    // Log cache miss metrics
    try {
      await supabase.from('cache_metrics').insert({
        source,
        start_date: startDate,
        end_date: endDate,
        cache_hit: false,
        partial_hit: false,
        refresh_triggered: true
      });
    } catch (metricsError) {
      console.error("Error logging cache metrics:", metricsError);
    }
    
    return new Response(
      JSON.stringify({
        cached: false,
        status: "not_cached",
        metrics: {
          source,
          startDate,
          endDate,
          cacheHit: false
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in cache-manager function:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
