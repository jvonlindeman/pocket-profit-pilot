
import { Transaction } from "../../../types/financial";
import { CacheSource } from "../types";
import { supabase } from "../../../integrations/supabase/client";

/**
 * Functions for handling legacy storage operations (for backward compatibility)
 */
export const legacyStorage = {
  /**
   * Check if a date range exists in cache using database function
   * Legacy method kept for backward compatibility
   */
  async checkDateRangeCached(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ) {
    try {
      const { data, error } = await supabase.rpc('is_date_range_cached', {
        p_source: source,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      if (error) {
        console.error("Error checking if date range is cached:", error);
        return { 
          is_cached: false,
          is_partial: false,
          segments_found: 0,
          missing_start_date: startDate,
          missing_end_date: endDate
        };
      }
      
      return data[0];
    } catch (err) {
      console.error("Error in checkDateRangeCached:", err);
      return { 
        is_cached: false,
        is_partial: false,
        segments_found: 0,
        missing_start_date: startDate,
        missing_end_date: endDate
      };
    }
  },

  /**
   * Retrieve transactions from cache
   * Legacy method kept for backward compatibility
   */
  async getTransactions(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('cached_transactions')
        .select('*')
        .eq('source', source)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) {
        console.error("Error retrieving transactions:", error);
        return [];
      }
      
      return data as Transaction[];
    } catch (err) {
      console.error("Error in getTransactions:", err);
      return [];
    }
  },

  /**
   * Store transactions in cache
   * Legacy method kept for backward compatibility
   */
  async storeTransactions(
    source: CacheSource | string,
    startDate: string,
    endDate: string,
    transactions: Transaction[],
    segmentId: string
  ): Promise<boolean> {
    try {
      // Prepare transactions with segment_id
      const preparedTransactions = transactions.map(tx => {
        const txDate = new Date(tx.date);
        return {
          ...tx,
          source,
          segment_id: segmentId,
          year: txDate.getFullYear(),
          month: txDate.getMonth() + 1,
          // Ensure external_id is not undefined
          external_id: tx.external_id || tx.id || `${source}-${tx.date}-${tx.amount}`
        };
      });
      
      // Insert the transactions in batches
      const batchSize = 100;
      for (let i = 0; i < preparedTransactions.length; i += batchSize) {
        const batch = preparedTransactions.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('cached_transactions')
          .upsert(
            batch,
            { 
              onConflict: 'source,external_id',
              ignoreDuplicates: false
            }
          );
        
        if (error) {
          console.error(`Error storing transactions batch ${i / batchSize + 1}:`, error);
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error("Error in storeTransactions:", err);
      return false;
    }
  },

  /**
   * Get cache segment information
   * Legacy method kept for backward compatibility
   */
  async getCacheSegmentInfo(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ) {
    try {
      const { data, error } = await supabase
        .from('cache_segments')
        .select('id, transaction_count')
        .eq('source', source)
        .lte('start_date', startDate)
        .gte('end_date', endDate)
        .eq('status', 'complete')
        .order('last_refreshed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error("Error retrieving cache segment info:", error);
        }
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Error in getCacheSegmentInfo:", err);
      return null;
    }
  },

  /**
   * Create a new cache segment
   */
  async createSegment(
    source: CacheSource | string,
    startDate: string,
    endDate: string,
    transactionCount: number
  ): Promise<{ success: boolean; segmentId?: string }> {
    try {
      const { data, error } = await supabase
        .from('cache_segments')
        .insert({
          source,
          start_date: startDate,
          end_date: endDate,
          transaction_count: transactionCount,
          status: 'complete',
          last_refreshed_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error("Error creating cache segment:", error);
        return { success: false };
      }
      
      return { success: true, segmentId: data.id };
    } catch (err) {
      console.error("Error in createSegment:", err);
      return { success: false };
    }
  },

  /**
   * Update a cache segment's status
   */
  async updateSegment(
    segmentId: string,
    status: 'complete' | 'partial' | 'error'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cache_segments')
        .update({
          status,
          last_refreshed_at: new Date().toISOString()
        })
        .eq('id', segmentId);
      
      if (error) {
        console.error("Error updating cache segment:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error in updateSegment:", err);
      return false;
    }
  },

  /**
   * Delete segments based on filtering criteria
   */
  async deleteSegments(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('cache_segments')
        .delete();
      
      if (source) {
        query = query.eq('source', source);
      }
      
      if (startDate && endDate) {
        query = query
          .gte('start_date', startDate)
          .lte('end_date', endDate);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error("Error deleting cache segments:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error in deleteSegments:", err);
      return false;
    }
  }
};
