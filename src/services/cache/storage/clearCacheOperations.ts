
import { CacheSource, CacheClearOptions } from "../types";
import { supabase } from "../../../integrations/supabase/client";

/**
 * Functions for clearing cache data
 */
export const clearCacheOperations = {
  /**
   * Clear monthly cache
   */
  async clearMonthlyCache(
    source?: CacheSource,
    year?: number,
    month?: number
  ): Promise<boolean> {
    try {
      // First delete the monthly_cache entries
      let cacheQuery = supabase
        .from('monthly_cache')
        .delete();
      
      if (source) {
        cacheQuery = cacheQuery.eq('source', source);
      }
      
      if (year !== undefined) {
        cacheQuery = cacheQuery.eq('year', year);
      }
      
      if (month !== undefined) {
        cacheQuery = cacheQuery.eq('month', month);
      }
      
      const { error: cacheError } = await cacheQuery;
      
      if (cacheError) {
        console.error("Error clearing monthly_cache:", cacheError);
        return false;
      }
      
      // Then delete the transactions
      let txQuery = supabase
        .from('cached_transactions')
        .delete();
      
      if (source) {
        txQuery = txQuery.eq('source', source);
      }
      
      if (year !== undefined) {
        txQuery = txQuery.eq('year', year);
      }
      
      if (month !== undefined) {
        txQuery = txQuery.eq('month', month);
      }
      
      const { error: txError } = await txQuery;
      
      if (txError) {
        console.error("Error clearing cached_transactions:", txError);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error in clearMonthlyCache:", err);
      return false;
    }
  },

  /**
   * Clear cache data
   */
  async clearCache(
    source?: CacheSource | 'all',
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      // First delete the cache_segments entries
      let segmentQuery = supabase
        .from('cache_segments')
        .delete();
      
      if (source && source !== 'all') {
        segmentQuery = segmentQuery.eq('source', source);
      }
      
      if (startDate && endDate) {
        segmentQuery = segmentQuery
          .gte('start_date', startDate)
          .lte('end_date', endDate);
      }
      
      const { error: segmentError } = await segmentQuery;
      
      if (segmentError) {
        console.error("Error clearing cache_segments:", segmentError);
        return false;
      }
      
      // Then delete the transactions
      let txQuery = supabase
        .from('cached_transactions')
        .delete();
      
      if (source && source !== 'all') {
        txQuery = txQuery.eq('source', source);
      }
      
      if (startDate && endDate) {
        txQuery = txQuery
          .gte('date', startDate)
          .lte('date', endDate);
      }
      
      const { error: txError } = await txQuery;
      
      if (txError) {
        console.error("Error clearing cached_transactions:", txError);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error in clearCache:", err);
      return false;
    }
  },

  /**
   * Delete transactions
   */
  async deleteTransactions(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('cached_transactions')
        .delete();
      
      if (source) {
        query = query.eq('source', source);
      }
      
      if (startDate && endDate) {
        query = query
          .gte('date', startDate)
          .lte('date', endDate);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error("Error deleting transactions:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error in deleteTransactions:", err);
      return false;
    }
  }
};
