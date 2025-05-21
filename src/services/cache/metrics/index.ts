
import { CacheSource } from "../types";
import { cacheAccessMetrics } from "./cacheAccessMetrics";
import { cacheIntegrityMetrics } from "./cacheIntegrityMetrics";
import { cacheStatsMetrics } from "./cacheStatsMetrics";

/**
 * CacheMetrics provides a unified API for cache metrics functionality
 */
export class CacheMetrics {
  /**
   * Get cache statistics for admin dashboard
   */
  async getCacheStats() {
    return cacheStatsMetrics.getCacheStats();
  }

  /**
   * Verify cache integrity for a date range
   */
  async verifyCacheIntegrity(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ) {
    return cacheIntegrityMetrics.verifyCacheIntegrity(source, startDate, endDate);
  }
  
  /**
   * Record cache access metrics
   */
  async recordCacheAccess(
    source: CacheSource | string,
    startDate: string | Date,
    endDate: string | Date,
    cacheHit: boolean,
    partialHit: boolean,
    transactionCount?: number,
    refreshTriggered = false
  ): Promise<boolean> {
    return cacheAccessMetrics.recordCacheAccess(
      source, 
      startDate, 
      endDate, 
      cacheHit, 
      partialHit, 
      transactionCount,
      refreshTriggered
    );
  }
  
  /**
   * Record cache update metrics
   */
  async recordCacheUpdate(
    source: CacheSource | string,
    startDate: string | Date,
    endDate: string | Date,
    transactionCount: number
  ): Promise<boolean> {
    return cacheAccessMetrics.recordCacheUpdate(source, startDate, endDate, transactionCount);
  }
  
  /**
   * Record generic cache operation
   */
  async recordCacheOperation(
    source: CacheSource | string,
    startDate: string | Date,
    endDate: string | Date,
    operation: string
  ): Promise<boolean> {
    return cacheAccessMetrics.recordCacheOperation(source, startDate, endDate, operation);
  }
}

export const cacheMetrics = new CacheMetrics();
