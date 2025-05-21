
import { CacheResponse } from "../types";
import { checkCache } from "./checkCache";
import { storeTransactions } from "./storeTransactions";
import { clearCache } from "./clearCache";
import { getCacheSegmentId, refreshCache, repairCacheSegments } from "./cacheSegments";

/**
 * CacheOperations provides the high-level cache functionality
 */
export class CacheOperations {
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
  async checkCache(...args: Parameters<typeof checkCache>): ReturnType<typeof checkCache> {
    return checkCache(...args);
  }

  /**
   * Store transactions in cache
   */
  async storeTransactions(...args: Parameters<typeof storeTransactions>): ReturnType<typeof storeTransactions> {
    return storeTransactions(...args);
  }

  /**
   * Clear cache
   */
  async clearCache(...args: Parameters<typeof clearCache>): ReturnType<typeof clearCache> {
    return clearCache(...args);
  }

  /**
   * Get cache segment ID for a date range
   */
  async getCacheSegmentId(...args: Parameters<typeof getCacheSegmentId>): ReturnType<typeof getCacheSegmentId> {
    return getCacheSegmentId(...args);
  }
  
  /**
   * Refresh cache data for a date range
   */
  async refreshCache(...args: Parameters<typeof refreshCache>): ReturnType<typeof refreshCache> {
    return refreshCache(...args);
  }
  
  /**
   * Repair cache segments to match actual transaction counts
   */
  async repairCacheSegments(...args: Parameters<typeof repairCacheSegments>): ReturnType<typeof repairCacheSegments> {
    return repairCacheSegments(...args);
  }
}

export const cacheOperations = new CacheOperations();
