
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
  }
};

export default CacheService;
// Use export type for types to fix the isolatedModules issue
export type { CacheClearOptions, CacheResponse, CacheResult, CacheStats, DetailedCacheStats, CacheSource };
