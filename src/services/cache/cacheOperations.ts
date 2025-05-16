
import { Transaction } from "../../types/financial";
import { supabase } from "../../integrations/supabase/client";
import { CacheResponse } from "./cacheTypes";

class CacheOperations {
  private lastCacheCheckResult: CacheResponse | null = null;

  /**
   * Store the last cache check result
   */
  setLastCacheCheckResult(result: CacheResponse): void {
    this.lastCacheCheckResult = result;
  }

  /**
   * Get the last cache check result
   */
  getLastCacheCheckResult(): CacheResponse | null {
    return this.lastCacheCheckResult;
  }

  /**
   * Check cache for transactions
   */
  async checkCache(
    source: string,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse> {
    // Format dates for API
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    // Prepare response for API error cases
    const errorResponse: CacheResponse = {
      cached: false,
      status: "error",
      partial: false,
    };

    try {
      // If force refresh, skip cache check
      if (forceRefresh) {
        return { cached: false, status: "force_refresh", partial: false };
      }

      // Check if date range is in cache using database function
      const { data, error } = await supabase.rpc('is_date_range_cached', {
        p_source: source,
        p_start_date: formattedStartDate,
        p_end_date: formattedEndDate
      });
      
      if (error) {
        console.error("Error checking cache via RPC:", error);
        return errorResponse;
      }
      
      if (!data || data.length === 0) {
        console.warn("No cache data returned from RPC call");
        return errorResponse;
      }
      
      const cacheInfo = data[0];
      
      // Get transactions if cached
      if (cacheInfo.is_cached) {
        const { data: transactions, error: txError } = await supabase
          .from('cached_transactions')
          .select('*')
          .eq('source', source)
          .gte('date', formattedStartDate)
          .lte('date', formattedEndDate)
          .order('date', { ascending: false });
          
        if (txError) {
          console.error("Error fetching cached transactions:", txError);
          return errorResponse;
        }
        
        // Format the response with the cache status
        const response: CacheResponse = {
          cached: true,
          status: "complete",
          data: transactions as Transaction[],
          partial: cacheInfo.is_partial,
        };
        
        // If partial, include missing ranges
        if (cacheInfo.is_partial) {
          response.missingRanges = {
            startDate: cacheInfo.missing_start_date,
            endDate: cacheInfo.missing_end_date,
          };
        }
        
        this.setLastCacheCheckResult(response);
        return response;
      }
      
      // Not cached
      return {
        cached: false,
        status: "not_cached",
        partial: false,
      };
    } catch (err) {
      console.error("Exception checking cache:", err);
      return errorResponse;
    }
  }

  /**
   * Store transactions in cache
   */
  async storeTransactions(
    source: string,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<boolean> {
    try {
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      
      console.log(`Storing ${transactions.length} transactions in cache for ${source}...`);
      
      // First, create a new cache segment
      const { data: segmentData, error: segmentError } = await supabase
        .from('cache_segments')
        .insert({
          source,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          transaction_count: transactions.length,
          status: 'complete'
        })
        .select()
        .single();
        
      if (segmentError) {
        console.error("Error creating cache segment:", segmentError);
        return false;
      }
      
      // Now, store the transactions in batches (to avoid payload limits)
      const batchSize = 100;
      const batches = [];
      
      // Format transactions for the database
      const dbTransactions = transactions.map(t => ({
        external_id: t.id,
        date: t.date.split('T')[0], // Ensure we just get the date part
        amount: t.amount,
        description: t.description,
        category: t.category,
        type: t.type,
        source: t.source,
        fees: t.fees || null,
        gross: t.gross || null,
        metadata: t.metadata || {}
      }));
      
      // Create batches
      for (let i = 0; i < dbTransactions.length; i += batchSize) {
        const batch = dbTransactions.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Store each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const { error: batchError } = await supabase
          .from('cached_transactions')
          .upsert(batch, { 
            onConflict: 'source,external_id',
            ignoreDuplicates: true
          });
          
        if (batchError) {
          console.error(`Error storing batch ${i+1}/${batches.length}:`, batchError);
          
          // Update the segment status to partial
          await supabase
            .from('cache_segments')
            .update({ 
              status: 'partial',
              transaction_count: i * batchSize 
            })
            .eq('id', segmentData.id);
            
          return false;
        }
        
        console.log(`Stored batch ${i+1}/${batches.length} (${batch.length} transactions)`);
      }
      
      console.log(`Successfully stored ${transactions.length} transactions in cache`);
      return true;
    } catch (err) {
      console.error("Exception storing transactions in cache:", err);
      return false;
    }
  }

  /**
   * Verify cache integrity
   */
  async verifyCacheIntegrity(
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ isConsistent: boolean, segmentCount: number, transactionCount: number }> {
    try {
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      
      // Count segments
      const { count: segmentCount, error: segmentError } = await supabase
        .from('cache_segments')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .lte('start_date', formattedStartDate)
        .gte('end_date', formattedEndDate)
        .eq('status', 'complete');
        
      if (segmentError) {
        console.error("Error counting cache segments:", segmentError);
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      // Count transactions
      const { count: transactionCount, error: txError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
        
      if (txError) {
        console.error("Error counting cache transactions:", txError);
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      // Check consistency
      const isConsistent = segmentCount > 0 && transactionCount > 0;
      
      return {
        isConsistent,
        segmentCount: segmentCount || 0,
        transactionCount: transactionCount || 0
      };
    } catch (err) {
      console.error("Exception verifying cache integrity:", err);
      return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
    }
  }

  /**
   * Repair cache segments
   */
  async repairCacheSegments(
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    try {
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      
      // Count transactions
      const { count: transactionCount, error: txError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
        
      if (txError) {
        console.error("Error counting cache transactions:", txError);
        return false;
      }
      
      // Update or create segment
      const { data: segments, error: segmentError } = await supabase
        .from('cache_segments')
        .select('*')
        .eq('source', source)
        .lte('start_date', formattedStartDate)
        .gte('end_date', formattedEndDate);
        
      if (segmentError) {
        console.error("Error getting cache segments:", segmentError);
        return false;
      }
      
      if (segments && segments.length > 0) {
        // Update existing segment
        const { error: updateError } = await supabase
          .from('cache_segments')
          .update({ 
            transaction_count: transactionCount || 0,
            status: 'complete',
            last_refreshed_at: new Date().toISOString()
          })
          .eq('id', segments[0].id);
          
        if (updateError) {
          console.error("Error updating cache segment:", updateError);
          return false;
        }
      } else {
        // Create new segment
        const { error: createError } = await supabase
          .from('cache_segments')
          .insert({
            source,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            transaction_count: transactionCount || 0,
            status: 'complete'
          });
          
        if (createError) {
          console.error("Error creating cache segment:", createError);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error("Exception repairing cache segments:", err);
      return false;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(
    options?: {
      source?: 'Zoho' | 'Stripe' | 'all';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<boolean> {
    try {
      const source = options?.source || 'all';
      
      // Clear segments
      let segmentQuery = supabase.from('cache_segments').delete();
      
      if (source !== 'all') {
        segmentQuery = segmentQuery.eq('source', source);
      }
      
      if (options?.startDate && options?.endDate) {
        const formattedStartDate = options.startDate.toISOString().split("T")[0];
        const formattedEndDate = options.endDate.toISOString().split("T")[0];
        
        segmentQuery = segmentQuery
          .gte('start_date', formattedStartDate)
          .lte('end_date', formattedEndDate);
      }
      
      const { error: segmentError } = await segmentQuery;
      
      if (segmentError) {
        console.error("Error clearing cache segments:", segmentError);
        return false;
      }
      
      // Clear transactions
      let txQuery = supabase.from('cached_transactions').delete();
      
      if (source !== 'all') {
        txQuery = txQuery.eq('source', source);
      }
      
      if (options?.startDate && options?.endDate) {
        const formattedStartDate = options.startDate.toISOString().split("T")[0];
        const formattedEndDate = options.endDate.toISOString().split("T")[0];
        
        txQuery = txQuery
          .gte('date', formattedStartDate)
          .lte('date', formattedEndDate);
      }
      
      const { error: txError } = await txQuery;
      
      if (txError) {
        console.error("Error clearing cached transactions:", txError);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Exception clearing cache:", err);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    transactions: { source: string; count: number }[];
    segments: { source: string; count: number }[];
  }> {
    try {
      // Get transaction counts by source
      const { data: txData, error: txError } = await supabase
        .from('cached_transactions')
        .select('source')
        .then(async ({ data, error }) => {
          if (error || !data) {
            return { data: [], error };
          }
          
          // Group by source and count
          const counts: Record<string, number> = {};
          data.forEach(tx => {
            const source = tx.source;
            counts[source] = (counts[source] || 0) + 1;
          });
          
          return { 
            data: Object.entries(counts).map(([source, count]) => ({ 
              source, count 
            })),
            error: null
          };
        });
        
      if (txError) {
        console.error("Error getting transaction stats:", txError);
        return { transactions: [], segments: [] };
      }
      
      // Get segment counts by source
      const { data: segmentData, error: segmentError } = await supabase
        .from('cache_segments')
        .select('source')
        .then(async ({ data, error }) => {
          if (error || !data) {
            return { data: [], error };
          }
          
          // Group by source and count
          const counts: Record<string, number> = {};
          data.forEach(segment => {
            const source = segment.source;
            counts[source] = (counts[source] || 0) + 1;
          });
          
          return { 
            data: Object.entries(counts).map(([source, count]) => ({ 
              source, count 
            })),
            error: null
          };
        });
        
      if (segmentError) {
        console.error("Error getting segment stats:", segmentError);
        return { transactions: txData || [], segments: [] };
      }
      
      return {
        transactions: txData || [],
        segments: segmentData || []
      };
    } catch (err) {
      console.error("Exception getting cache stats:", err);
      return { transactions: [], segments: [] };
    }
  }

  /**
   * Get cache segment information for a date range
   */
  async getCacheSegmentInfo(
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    data: { id: string; transaction_count: number } | null;
    error: any;
  }> {
    // Format dates for API
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];
    
    try {
      // Find matching cache segment
      const { data, error } = await supabase
        .from('cache_segments')
        .select('id, transaction_count')
        .eq('source', source)
        .lte('start_date', formattedStartDate)
        .gte('end_date', formattedEndDate)
        .eq('status', 'complete')
        .limit(1)
        .maybeSingle();
        
      return { data, error };
    } catch (err) {
      console.error("Exception getting cache segment info:", err);
      return { data: null, error: err };
    }
  }
}

export const cacheOperations = new CacheOperations();
