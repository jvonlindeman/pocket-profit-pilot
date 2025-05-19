
import { supabase } from "../../integrations/supabase/client";
import { Transaction } from "../../types/financial";
import { CacheSegmentInfo, CacheSourceStats, DetailedCacheStats } from "./types";

/**
 * CacheStorage handles all database interactions for the cache system
 */
export class CacheStorage {
  /**
   * Check if a date range exists in cache using database function
   */
  async checkDateRangeCached(
    source: string,
    startDate: string,
    endDate: string
  ): Promise<{
    is_cached: boolean;
    is_partial: boolean;
    segments_found: number;
    missing_start_date: string | null;
    missing_end_date: string | null;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('is_date_range_cached', {
        p_source: source,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      if (error) {
        console.error("Error checking cache via RPC:", error);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.warn("No cache data returned from RPC call");
        return null;
      }
      
      return data[0];
    } catch (err) {
      console.error("Exception checking cache status:", err);
      return null;
    }
  }

  /**
   * Retrieve transactions from cache
   */
  async getTransactions(
    source: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('cached_transactions')
        .select('*')
        .eq('source', source)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
        
      if (error) {
        console.error("Error fetching cached transactions:", error);
        return [];
      }
      
      return data as Transaction[];
    } catch (err) {
      console.error("Exception retrieving transactions:", err);
      return [];
    }
  }

  /**
   * Store transactions in cache
   */
  async storeTransactions(
    source: string,
    startDate: string,
    endDate: string,
    transactions: Transaction[]
  ): Promise<{ success: boolean; segmentId?: string }> {
    try {
      console.log(`Storing ${transactions.length} transactions in cache for ${source}...`);
      
      // First, create a new cache segment
      const { data: segmentData, error: segmentError } = await supabase
        .from('cache_segments')
        .insert({
          source,
          start_date: startDate,
          end_date: endDate,
          transaction_count: transactions.length,
          status: 'complete'
        })
        .select()
        .single();
        
      if (segmentError) {
        console.error("Error creating cache segment:", segmentError);
        return { success: false };
      }
      
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
      
      // Store transactions in batches to avoid payload limits
      const batchSize = 100;
      const batches = [];
      
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
            
          return { success: false };
        }
        
        console.log(`Stored batch ${i+1}/${batches.length} (${batch.length} transactions)`);
      }
      
      console.log(`Successfully stored ${transactions.length} transactions in cache`);
      return { success: true, segmentId: segmentData.id };
    } catch (err) {
      console.error("Exception storing transactions in cache:", err);
      return { success: false };
    }
  }

  /**
   * Get cache segment information
   */
  async getCacheSegmentInfo(
    source: string,
    startDate: string,
    endDate: string
  ): Promise<CacheSegmentInfo | null> {
    try {
      const { data, error } = await supabase
        .from('cache_segments')
        .select('id, transaction_count')
        .eq('source', source)
        .lte('start_date', startDate)
        .gte('end_date', endDate)
        .eq('status', 'complete')
        .limit(1)
        .maybeSingle();
        
      if (error || !data) {
        return null;
      }
      
      return data as CacheSegmentInfo;
    } catch (err) {
      console.error("Exception getting cache segment info:", err);
      return null;
    }
  }

  /**
   * Get cache statistics by source
   */
  async getDetailedStats(): Promise<DetailedCacheStats> {
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
   * Clear cache data
   */
  async clearCache(
    source?: 'Zoho' | 'Stripe' | 'all',
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      const sourceFilter = source && source !== 'all' ? source : undefined;
      
      // Clear segments
      let segmentQuery = supabase.from('cache_segments').delete();
      
      if (sourceFilter) {
        segmentQuery = segmentQuery.eq('source', sourceFilter);
      }
      
      if (startDate && endDate) {
        segmentQuery = segmentQuery
          .gte('start_date', startDate)
          .lte('end_date', endDate);
      }
      
      const { error: segmentError } = await segmentQuery;
      
      if (segmentError) {
        console.error("Error clearing cache segments:", segmentError);
        return false;
      }
      
      // Clear transactions
      let txQuery = supabase.from('cached_transactions').delete();
      
      if (sourceFilter) {
        txQuery = txQuery.eq('source', sourceFilter);
      }
      
      if (startDate && endDate) {
        txQuery = txQuery
          .gte('date', startDate)
          .lte('date', endDate);
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
}

export const cacheStorage = new CacheStorage();
