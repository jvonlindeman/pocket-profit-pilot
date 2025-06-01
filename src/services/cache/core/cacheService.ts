
import { Transaction } from "../../../types/financial";
import { cacheOperations } from "../operations";
import { cacheMetrics } from "../metrics";
import { cacheStorage } from "../storage";
import { cacheStalenessManager } from "../staleness";
import type { CacheResponse, CacheResult, DetailedCacheStats, CacheClearOptions, CacheSource, CacheStats } from "../types";
import { CacheHelpers } from "./cacheHelpers";
import { CacheValidation } from "./cacheValidation";

/**
 * Main CacheService class with enhanced collaborator data handling
 */
export class CacheService {
  /**
   * Check if data for a date range is in cache with staleness information
   */
  async checkCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse & { isStale?: boolean }> {
    // Validate inputs
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    // If force refresh, clear cache immediately and return miss
    if (forceRefresh) {
      CacheHelpers.logCacheOperation('🔄', source, startDate, endDate, { action: 'force_refresh_clearing' });
      if (cacheStalenessManager) {
        await cacheStalenessManager.markCacheStale(source, startDate, endDate);
      }
      return {
        cached: false,
        status: "force_refresh_cleared",
        partial: false,
        isStale: false
      };
    }
    
    const result = await cacheOperations.checkCache(source, startDate, endDate, forceRefresh);
    
    // Add staleness information
    const isStale = cacheStalenessManager ? await cacheStalenessManager.isCacheStale(source, startDate, endDate) : false;
    
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
  }
  
  /**
   * Mark cache as stale and physically clear it - Enhanced for collaborator data
   */
  async markCacheStale(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    CacheHelpers.logCacheOperation('🗑️', source, startDate, endDate, { action: 'mark_stale_and_clear' });
    if (cacheStalenessManager) {
      await cacheStalenessManager.markCacheStale(source, startDate, endDate);
    }
  }

  /**
   * Clear staleness marking after successful refresh
   */
  clearStaleness(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): void {
    if (cacheStalenessManager) {
      cacheStalenessManager.clearStaleness(source, startDate, endDate);
    }
  }
  
  /**
   * Store transactions in cache with enhanced logging for collaborators
   */
  async storeTransactions(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<boolean> {
    // Validate inputs
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    if (transactions.length === 0) {
      console.warn('⚠️ CacheService: Attempting to store empty transactions array');
      return true; // Not an error, but nothing to store
    }

    const collaboratorTransactions = CacheHelpers.filterCollaboratorTransactions(transactions);
    
    CacheHelpers.logCacheOperation('💾', source, startDate, endDate, {
      action: 'storing_fresh_transactions',
      total: transactions.length,
      collaborators: collaboratorTransactions.length
    });
    
    const success = await cacheOperations.storeTransactions(source, startDate, endDate, transactions);
    
    // Clear staleness on successful store
    if (success && cacheStalenessManager) {
      cacheStalenessManager.clearStaleness(source, startDate, endDate);
      console.log(`✅ CacheService: Successfully stored and cleared staleness for ${source}`);
    }
    
    return success;
  }
  
  /**
   * Store transactions in monthly cache (preferred method)
   */
  async storeMonthTransactions(
    source: CacheSource,
    date: Date,
    transactions: Transaction[]
  ): Promise<boolean> {
    // Validate inputs
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    if (transactions.length === 0) {
      console.warn('⚠️ CacheService: Attempting to store empty transactions array for monthly cache');
      return true;
    }

    const { year, month } = CacheHelpers.getYearAndMonth(date);
    console.log(`💾 CacheService: Storing ${transactions.length} fresh transactions for ${source} ${year}-${month}`);
    
    const success = await cacheStorage.storeMonthTransactions(source, year, month, transactions);
    
    // Clear staleness on successful store
    if (success && cacheStalenessManager) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      cacheStalenessManager.clearStaleness(source, startDate, endDate);
      console.log(`✅ CacheService: Successfully stored monthly cache and cleared staleness for ${source}`);
    }
    
    return success;
  }

  /**
   * Get the last cache check result (useful for debugging)
   */
  getLastCacheCheckResult(): CacheResponse | null {
    return cacheOperations.getLastCacheCheckResult();
  }
  
  /**
   * Get cache statistics for admin dashboard
   */
  async getCacheStats(): Promise<Partial<CacheStats> & { lastUpdated: string }> {
    return cacheMetrics.getCacheStats();
  }
  
  /**
   * Verify cache integrity for a date range
   */
  async verifyCacheIntegrity(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<{ isConsistent: boolean, segmentCount: number, transactionCount: number }> {
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    return cacheMetrics.verifyCacheIntegrity(
      source, 
      startDate.toISOString().split("T")[0], 
      endDate.toISOString().split("T")[0]
    );
  }
  
  /**
   * Repair cache segments to match actual transaction counts
   */
  async repairCacheSegments(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    return cacheOperations.repairCacheSegments(source, startDate, endDate);
  }
  
  /**
   * Clear cache data for testing
   */
  async clearCache(options?: CacheClearOptions): Promise<boolean> {
    const validation = CacheValidation.validateClearOptions(options);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return cacheOperations.clearCache(options);
  }
  
  /**
   * Get detailed cache statistics
   */
  async getDetailedStats(): Promise<DetailedCacheStats> {
    return cacheStorage.getDetailedStats();
  }

  /**
   * Get cache segment id for a date range
   */
  async getCacheSegmentId(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<string | null> {
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    return cacheOperations.getCacheSegmentId(source, startDate, endDate);
  }
  
  /**
   * Refresh cache data for a date range
   */
  async refreshCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    return cacheOperations.refreshCache(source, startDate, endDate);
  }
  
  /**
   * Check cache status and record metrics
   */
  async recordCacheAccess(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    isCacheHit: boolean,
    isPartial: boolean,
    transactionCount?: number
  ): Promise<boolean> {
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    return cacheMetrics.recordCacheAccess(source, startDate, endDate, isCacheHit, isPartial, transactionCount);
  }
  
  /**
   * Fix cache entries with missing year/month values
   */
  async fixMissingYearMonthValues(source?: CacheSource): Promise<number> {
    console.log("CacheService: Attempting to fix cached transactions with missing year/month values");
    
    try {
      return await cacheStorage.fixLegacyTransactions(source);
    } catch (err) {
      console.error("Error fixing missing year/month values:", err);
      return 0;
    }
  }
  
  /**
   * Force complete cache refresh for troubleshooting collaborator issues
   */
  async forceCompleteRefresh(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const sourceValidation = CacheValidation.validateCacheSource(source);
    if (!sourceValidation.isValid) {
      throw new Error(sourceValidation.error);
    }

    const dateValidation = CacheValidation.validateDateRange(startDate, endDate);
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error);
    }

    CacheHelpers.logCacheOperation('🔄', source, startDate, endDate, { action: 'force_complete_refresh' });
    
    try {
      // 1. Mark cache as stale
      if (cacheStalenessManager) {
        await cacheStalenessManager.markCacheStale(source, startDate, endDate);
      }
      
      // 2. Clear all cache segments for this date range
      const clearOptions: CacheClearOptions = {
        source,
        startDate,
        endDate
      };
      
      if (cacheOperations.clearCache) {
        await cacheOperations.clearCache(clearOptions);
      } else {
        console.warn(`⚠️ CacheService: clearCache method not available`);
      }
      
      console.log(`✅ CacheService: Force complete refresh completed for ${source}`);
      return true;
    } catch (error) {
      console.error(`❌ CacheService: Force complete refresh failed for ${source}:`, error);
      return false;
    }
  }
}
