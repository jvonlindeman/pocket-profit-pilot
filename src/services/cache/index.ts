
import { Transaction } from "../../types/financial";
import { cacheOperations } from "./operations";
import { cacheMetrics } from "./metrics";
import { cacheStorage } from "./storage";
import type { CacheResponse, CacheResult, CacheStats, DetailedCacheStats, CacheClearOptions, CacheSource } from "./types";

/**
 * CacheService provides a unified API for working with the transaction cache
 */
const CacheService = {
  /**
   * Check if data for a date range is in cache
   */
  checkCache: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse> => {
    return cacheOperations.checkCache(source, startDate, endDate, forceRefresh);
  },
  
  /**
   * Store transactions in cache
   */
  storeTransactions: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<boolean> => {
    return cacheOperations.storeTransactions(source, startDate, endDate, transactions);
  },
  
  /**
   * Store transactions in monthly cache (preferred method)
   */
  storeMonthTransactions: async (
    source: CacheSource,
    date: Date,
    transactions: Transaction[]
  ): Promise<boolean> => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    console.log(`CacheService: Storing ${transactions.length} transactions for ${source} ${year}-${month}`);
    return cacheStorage.storeMonthTransactions(source, year, month, transactions);
  },
  
  /**
   * Get the last cache check result (useful for debugging)
   */
  getLastCacheCheckResult: (): CacheResponse | null => {
    return cacheOperations.getLastCacheCheckResult();
  },
  
  /**
   * Get cache statistics for admin dashboard
   */
  getCacheStats: async (): Promise<Partial<CacheStats> & { lastUpdated: string }> => {
    return cacheMetrics.getCacheStats();
  },
  
  /**
   * Verify cache integrity for a date range
   */
  verifyCacheIntegrity: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<{ isConsistent: boolean, segmentCount: number, transactionCount: number }> => {
    return cacheMetrics.verifyCacheIntegrity(
      source, 
      startDate.toISOString().split("T")[0], 
      endDate.toISOString().split("T")[0]
    );
  },
  
  /**
   * Repair cache segments to match actual transaction counts
   */
  repairCacheSegments: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    return cacheOperations.repairCacheSegments(source, startDate, endDate);
  },
  
  /**
   * Clear cache data for testing
   * @param options Clear cache options
   * @returns Promise<boolean> Success status
   */
  clearCache: async (options?: CacheClearOptions): Promise<boolean> => {
    return cacheOperations.clearCache(options);
  },
  
  /**
   * Get detailed cache statistics
   */
  getDetailedStats: async (): Promise<DetailedCacheStats> => {
    return cacheStorage.getDetailedStats();
  },

  /**
   * Get cache segment id for a date range
   */
  getCacheSegmentId: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<string | null> => {
    return cacheOperations.getCacheSegmentId(source, startDate, endDate);
  },
  
  /**
   * Refresh cache data for a date range
   */
  refreshCache: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    return cacheOperations.refreshCache(source, startDate, endDate);
  },
  
  /**
   * Check cache status and record metrics
   */
  recordCacheAccess: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    isCacheHit: boolean,
    isPartial: boolean,
    transactionCount?: number
  ): Promise<boolean> => {
    return cacheMetrics.recordCacheAccess(source, startDate, endDate, isCacheHit, isPartial, transactionCount);
  },
  
  /**
   * Fix cache entries with missing year/month values
   * Helps migrate legacy cached data to the new format
   */
  fixMissingYearMonthValues: async (source?: CacheSource): Promise<number> => {
    console.log("CacheService: Attempting to fix cached transactions with missing year/month values");
    
    try {
      // Get transactions with null year/month values
      const { data, error } = await cacheStorage.getClient()
        .from('cached_transactions')
        .select('*')
        .is('year', null)
        .is('month', null)
        .order('date', { ascending: false })
        .limit(1000);
        
      if (error) {
        console.error("Error fetching transactions with null year/month:", error);
        return 0;
      }
      
      if (!data || data.length === 0) {
        console.log("No transactions found with missing year/month values");
        return 0;
      }
      
      console.log(`Found ${data.length} transactions with missing year/month values`);
      
      // Group transactions by month for batched updates
      const transactionsByMonth = new Map<string, any[]>();
      
      data.forEach(tx => {
        if (!tx.date) return;
        
        const txDate = new Date(tx.date);
        const year = txDate.getFullYear();
        const month = txDate.getMonth() + 1;
        const key = `${year}-${month}`;
        
        if (!transactionsByMonth.has(key)) {
          transactionsByMonth.set(key, []);
        }
        
        transactionsByMonth.get(key)!.push({
          id: tx.id,
          year,
          month
        });
      });
      
      // Update transactions in batches by month
      let totalFixed = 0;
      
      for (const [key, transactions] of transactionsByMonth.entries()) {
        const batchSize = 100;
        
        for (let i = 0; i < transactions.length; i += batchSize) {
          const batch = transactions.slice(i, i + batchSize);
          const { error } = await cacheStorage.getClient()
            .from('cached_transactions')
            .upsert(batch, { onConflict: 'id' });
            
          if (error) {
            console.error(`Error updating batch ${Math.floor(i/batchSize) + 1}:`, error);
          } else {
            console.log(`Successfully updated batch ${Math.floor(i/batchSize) + 1} (${batch.length} transactions)`);
            totalFixed += batch.length;
          }
        }
      }
      
      console.log(`Fixed ${totalFixed} transactions with missing year/month values`);
      return totalFixed;
    } catch (err) {
      console.error("Error fixing missing year/month values:", err);
      return 0;
    }
  }
};

export default CacheService;
// Use export type for types to fix the isolatedModules issue
export type { CacheClearOptions, CacheResponse, CacheResult, CacheStats, DetailedCacheStats, CacheSource };
