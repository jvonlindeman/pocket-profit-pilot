
import { Transaction } from "../../types/financial";
import { cacheOperations } from "./cacheOperations";
import { cacheMetrics } from "./cacheMetrics";
import { CacheResponse } from "./cacheTypes";

/**
 * CacheService provides a unified API for working with the transaction cache
 */
const CacheService = {
  /**
   * Check if data for a date range is in cache
   */
  checkCache: async (
    source: string,
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
    source: string,
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
  getCacheStats: async (): Promise<any> => {
    return cacheMetrics.getCacheStats();
  },
  
  /**
   * Verify cache integrity for a date range
   */
  verifyCacheIntegrity: async (
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ isConsistent: boolean, segmentCount: number, transactionCount: number }> => {
    return cacheOperations.verifyCacheIntegrity(source, startDate, endDate);
  },
  
  /**
   * Repair cache segments to match actual transaction counts
   */
  repairCacheSegments: async (
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    return cacheOperations.repairCacheSegments(source, startDate, endDate);
  }
};

export default CacheService;
