
import { Transaction } from "../../types/financial";
import { cacheStorage } from "./storage";
import { cacheMetrics } from "./metrics";
import { CacheResponse, CacheResult } from "./types";

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
    source: string,
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
        return { cached: false, status: "force_refresh", partial: false };
      }

      // Check if date range is in cache
      const cacheInfo = await cacheStorage.checkDateRangeCached(
        source,
        formattedStartDate,
        formattedEndDate
      );
      
      if (!cacheInfo) {
        return errorResponse;
      }
      
      // Get transactions if cached
      if (cacheInfo.is_cached) {
        const transactions = await cacheStorage.getTransactions(
          source,
          formattedStartDate,
          formattedEndDate
        );
          
        if (!transactions || transactions.length === 0) {
          return errorResponse;
        }
        
        // Format the response with the cache status
        const response: CacheResponse = {
          cached: true,
          status: "complete",
          data: transactions,
          partial: cacheInfo.is_partial,
        };
        
        // If partial, include missing ranges
        if (cacheInfo.is_partial) {
          response.missingRanges = {
            startDate: cacheInfo.missing_start_date,
            endDate: cacheInfo.missing_end_date,
          };
        }
        
        this.setLastCacheCheckResult(response);
        return response;
      }
      
      // Not cached
      return {
        cached: false,
        status: "not_cached",
        partial: false,
      };
    } catch (err) {
      console.error("Exception checking cache:", err);
      return errorResponse;
    }
  }

  /**
   * Store transactions in cache
   */
  async storeTransactions(
    source: string,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<boolean> {
    try {
      // Format dates for API
      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);
      
      const result = await cacheStorage.storeTransactions(
        source,
        formattedStartDate,
        formattedEndDate,
        transactions
      );
      
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
    source: string,
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
          source as 'Zoho' | 'Stripe',
          formattedStartDate,
          formattedEndDate
        );
        return false;
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
    source?: 'Zoho' | 'Stripe' | 'all';
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
    source: string,
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
}

export const cacheOperations = new CacheOperations();
