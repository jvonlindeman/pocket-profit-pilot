
import { Transaction } from "../../types/financial";
import { cacheStorage } from "./storage";
import { cacheMetrics } from "./metrics";
import { CacheResponse, CacheResult, CacheSource } from "./types";
import { supabase } from "../../integrations/supabase/client";

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
   * Format a date for API use
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Check cache for transactions
   */
  async checkCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse> {
    // Format dates for API
    const formattedStartDate = this.formatDate(startDate);
    const formattedEndDate = this.formatDate(endDate);

    // Prepare response for API error cases
    const errorResponse: CacheResponse = {
      cached: false,
      status: "error",
      partial: false,
    };

    try {
      // If force refresh, skip cache check
      if (forceRefresh) {
        // Record the cache access with forced refresh
        await cacheMetrics.recordCacheAccess(
          source,
          formattedStartDate,
          formattedEndDate,
          false,
          false,
          undefined,
          true
        );
        
        return { cached: false, status: "force_refresh", partial: false };
      }

      // Call the cache-manager edge function to check cache status
      const { data, error } = await supabase.functions.invoke("cache-manager", {
        body: {
          source,
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
      
      if (error) {
        console.error("Error calling cache-manager:", error);
        return errorResponse;
      }
      
      if (!data) {
        console.error("No data returned from cache-manager");
        return errorResponse;
      }
      
      // Process the cache response
      const cacheResponse: CacheResponse = {
        cached: data.cached || false,
        status: data.status || "unknown",
        data: data.data,
        partial: data.partial || false,
        missingRanges: data.missingRanges,
        metrics: data.metrics
      };
      
      // Store the cache check result
      this.setLastCacheCheckResult(cacheResponse);
      
      return cacheResponse;
    } catch (err) {
      console.error("Exception checking cache:", err);
      return errorResponse;
    }
  }

  /**
   * Store transactions in cache
   */
  async storeTransactions(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<boolean> {
    try {
      // Format dates for API
      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);
      
      // Store transactions in cache storage
      const result = await cacheStorage.storeTransactions(
        source,
        formattedStartDate,
        formattedEndDate,
        transactions
      );
      
      // Record a successful cache update
      if (result.success) {
        await cacheMetrics.recordCacheUpdate(
          source, 
          formattedStartDate,
          formattedEndDate,
          transactions.length
        );
      }
      
      return result.success;
    } catch (err) {
      console.error("Exception storing transactions in cache:", err);
      return false;
    }
  }

  /**
   * Repair cache segments
   */
  async repairCacheSegments(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    try {
      // Format dates for API
      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);
      
      // Check integrity
      const integrity = await cacheMetrics.verifyCacheIntegrity(
        source, 
        formattedStartDate,
        formattedEndDate
      );
      
      if (!integrity.isConsistent) {
        // Clear the cache range
        await cacheStorage.clearCache(
          source,
          formattedStartDate,
          formattedEndDate
        );
        
        // Record the repair operation
        await cacheMetrics.recordCacheOperation(
          source,
          formattedStartDate,
          formattedEndDate,
          "repair"
        );
        
        return true;
      }
      
      return true;
    } catch (err) {
      console.error("Exception repairing cache segments:", err);
      return false;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(options?: {
    source?: CacheSource | 'all';
    startDate?: Date;
    endDate?: Date;
  }): Promise<boolean> {
    try {
      const source = options?.source || 'all';
      let formattedStartDate: string | undefined;
      let formattedEndDate: string | undefined;
      
      if (options?.startDate && options?.endDate) {
        formattedStartDate = this.formatDate(options.startDate);
        formattedEndDate = this.formatDate(options.endDate);
      }
      
      // Record the clear operation
      if (formattedStartDate && formattedEndDate) {
        await cacheMetrics.recordCacheOperation(
          source === 'all' ? 'All' : source,
          formattedStartDate,
          formattedEndDate,
          "clear"
        );
      } else {
        await cacheMetrics.recordCacheOperation(
          source === 'all' ? 'All' : source,
          "all",
          "all",
          "clear"
        );
      }
      
      return await cacheStorage.clearCache(
        source,
        formattedStartDate,
        formattedEndDate
      );
    } catch (err) {
      console.error("Exception clearing cache:", err);
      return false;
    }
  }

  /**
   * Get cache segment ID for a date range
   */
  async getCacheSegmentId(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<string | null> {
    try {
      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);
      
      const segmentInfo = await cacheStorage.getCacheSegmentInfo(
        source,
        formattedStartDate,
        formattedEndDate
      );
      
      return segmentInfo?.id || null;
    } catch (error) {
      console.error("Error getting cache segment id:", error);
      return null;
    }
  }
  
  /**
   * Refresh cache data for a date range
   */
  async refreshCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    try {
      // Format dates for API
      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);
      
      // Call the cache-manager edge function with forceRefresh flag
      const { data, error } = await supabase.functions.invoke("cache-manager", {
        body: {
          source,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          forceRefresh: true
        }
      });
      
      if (error) {
        console.error("Error refreshing cache via cache-manager:", error);
        return false;
      }
      
      // Record the cache refresh attempt
      await cacheMetrics.recordCacheOperation(
        source,
        formattedStartDate,
        formattedEndDate,
        "refresh"
      );
      
      return data?.success || false;
    } catch (err) {
      console.error("Exception refreshing cache:", err);
      return false;
    }
  }
}

export const cacheOperations = new CacheOperations();
