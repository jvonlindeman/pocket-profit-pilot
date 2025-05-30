import { Transaction } from "../../types/financial";
import { cacheOperations } from "./operations";
import { cacheMetrics } from "./metrics";
import { cacheStorage } from "./storage";
import { cacheStalenessManager } from "./staleness";
import { supabase } from "../../integrations/supabase/client";
import type { CacheResponse, CacheResult, DetailedCacheStats, CacheClearOptions, CacheSource, CacheStats } from "./types";

/**
 * Enhanced CacheService with proper cache invalidation
 */
const CacheService = {
  /**
   * Check if data for a date range is in cache with staleness information
   */
  checkCache: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse & { isStale?: boolean }> => {
    // If force refresh, clear cache immediately and return miss
    if (forceRefresh) {
      console.log(`🔄 CacheService: Force refresh requested - clearing cache for ${source}`);
      await cacheStalenessManager.markCacheStale(source, startDate, endDate);
      return {
        cached: false,
        status: "force_refresh_cleared",
        partial: false,
        isStale: false
      };
    }
    
    const result = await cacheOperations.checkCache(source, startDate, endDate, forceRefresh);
    
    // Add staleness information
    const isStale = await cacheStalenessManager.isCacheStale(source, startDate, endDate);
    
    // If cache is stale, treat it as a miss
    if (isStale && result.cached) {
      console.log(`⚠️ CacheService: Cache is stale for ${source}, treating as miss`);
      return {
        cached: false,
        status: "stale_treated_as_miss",
        partial: false,
        isStale: true
      };
    }
    
    return {
      ...result,
      isStale
    };
  },
  
  /**
   * Mark cache as stale and physically clear it
   */
  markCacheStale: async (
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<void> => {
    await cacheStalenessManager.markCacheStale(source, startDate, endDate);
  },

  /**
   * Clear staleness marking after successful refresh
   */
  clearStaleness: (
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): void => {
    cacheStalenessManager.clearStaleness(source, startDate, endDate);
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
    console.log(`💾 CacheService: Storing ${transactions.length} fresh transactions for ${source}`);
    const success = await cacheOperations.storeTransactions(source, startDate, endDate, transactions);
    
    // Clear staleness on successful store
    if (success) {
      cacheStalenessManager.clearStaleness(source, startDate, endDate);
      console.log(`✅ CacheService: Successfully stored and cleared staleness for ${source}`);
    }
    
    return success;
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
    console.log(`💾 CacheService: Storing ${transactions.length} fresh transactions for ${source} ${year}-${month}`);
    
    const success = await cacheStorage.storeMonthTransactions(source, year, month, transactions);
    
    // Clear staleness on successful store
    if (success) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      cacheStalenessManager.clearStaleness(source, startDate, endDate);
      console.log(`✅ CacheService: Successfully stored monthly cache and cleared staleness for ${source}`);
    }
    
    return success;
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
      return await cacheStorage.fixLegacyTransactions(source);
    } catch (err) {
      console.error("Error fixing missing year/month values:", err);
      return 0;
    }
  }
};

export default CacheService;
// Use export type for types to fix the isolatedModules issue
export type { CacheClearOptions, CacheResponse, CacheResult, DetailedCacheStats, CacheSource, CacheStats };
