
import { Transaction } from "../../types/financial";
import { cacheStorage } from "./storage";
import { cacheMetrics } from "./metrics";
import { CacheResponse, CacheResult, CacheSource } from "./types";
import { supabase } from "../../integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

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
   * Extract year and month from date
   */
  private getYearAndMonth(date: Date): { year: number, month: number } {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1 // JavaScript months are 0-indexed, add 1 to match SQL conventions
    };
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
    
    // Extract year and month from dates
    const startInfo = this.getYearAndMonth(startDate);
    const endInfo = this.getYearAndMonth(endDate);

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

      // For the monthly approach, we check if the exact month is cached
      // The most common case is requesting data for exactly one month
      if (
        startInfo.year === endInfo.year && 
        startInfo.month === endInfo.month &&
        startDate.getDate() === 1 && 
        endDate.getDate() === new Date(endInfo.year, endInfo.month, 0).getDate()
      ) {
        // This is a request for exactly one month, which is our optimized case
        const isCached = await cacheStorage.isMonthCached(
          source, 
          startInfo.year, 
          startInfo.month
        );
        
        if (isCached) {
          // Get transactions for this month
          const transactions = await cacheStorage.getMonthTransactions(
            source,
            startInfo.year,
            startInfo.month
          );
          
          // Record the cache hit
          await cacheMetrics.recordCacheAccess(
            source,
            formattedStartDate,
            formattedEndDate,
            true,
            false,
            transactions.length
          );
          
          const result: CacheResponse = {
            cached: true,
            status: "complete",
            data: transactions,
            partial: false,
            metrics: {
              source,
              startDate: formattedStartDate,
              endDate: formattedEndDate,
              transactionCount: transactions.length,
              cacheHit: true,
              partialHit: false
            }
          };
          
          this.setLastCacheCheckResult(result);
          return result;
        } else {
          // Record the cache miss
          await cacheMetrics.recordCacheAccess(
            source,
            formattedStartDate,
            formattedEndDate,
            false,
            false,
            0
          );
          
          const result: CacheResponse = {
            cached: false,
            status: "missing",
            partial: false,
            metrics: {
              source,
              startDate: formattedStartDate,
              endDate: formattedEndDate,
              cacheHit: false,
              partialHit: false
            }
          };
          
          this.setLastCacheCheckResult(result);
          return result;
        }
      } 
      else {
        // This is a more complex date range, possibly spanning multiple months
        // Call the cache-manager edge function to handle this case
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
      }
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
      
      // Extract year and month
      const { year, month } = this.getYearAndMonth(startDate);
      
      // For most cases, we're storing exactly one month's worth of data
      if (
        startDate.getDate() === 1 && 
        endDate.getTime() >= endOfMonth(startDate).getTime()
      ) {
        // Filter transactions to ensure they belong to this month
        const currentMonthStart = startOfMonth(startDate);
        const currentMonthEnd = endOfMonth(startDate);
        
        const monthTransactions = transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= currentMonthStart && txDate <= currentMonthEnd;
        });
        
        if (monthTransactions.length > 0) {
          // Store transactions for this month
          const success = await cacheStorage.storeMonthTransactions(
            source, 
            year, 
            month, 
            monthTransactions
          );
          
          // Record a successful cache update
          if (success) {
            await cacheMetrics.recordCacheUpdate(
              source, 
              formattedStartDate,
              formattedEndDate,
              monthTransactions.length
            );
          }
          
          return success;
        }
        
        return true;
      } 
      else {
        // Complex case - processing a date range that doesn't match exactly one month
        // Store transactions in monthly buckets
        const monthMap = new Map<string, Transaction[]>();
        
        transactions.forEach(tx => {
          const txDate = new Date(tx.date);
          const key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
          
          if (!monthMap.has(key)) {
            monthMap.set(key, []);
          }
          
          monthMap.get(key)!.push(tx);
        });
        
        // Store each month's transactions separately
        const results: boolean[] = [];
        for (const [key, txs] of monthMap.entries()) {
          const [yearStr, monthStr] = key.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);
          
          const success = await cacheStorage.storeMonthTransactions(
            source,
            year,
            month,
            txs
          );
          
          results.push(success);
          
          if (success) {
            // Calculate the month's date range for metrics
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = endOfMonth(monthStart);
            
            await cacheMetrics.recordCacheUpdate(
              source,
              this.formatDate(monthStart),
              this.formatDate(monthEnd),
              txs.length
            );
          }
        }
        
        return results.every(result => result);
      }
    } catch (err) {
      console.error("Exception storing transactions in cache:", err);
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
        
        // If this is a full month, use the monthly approach
        const startInfo = this.getYearAndMonth(options.startDate);
        const endInfo = this.getYearAndMonth(options.endDate);
        
        if (
          startInfo.year === endInfo.year &&
          startInfo.month === endInfo.month &&
          options.startDate.getDate() === 1 &&
          options.endDate.getDate() === new Date(endInfo.year, endInfo.month, 0).getDate()
        ) {
          // Record the clear operation
          await cacheMetrics.recordCacheOperation(
            source === 'all' ? 'All' : source,
            formattedStartDate,
            formattedEndDate,
            "clear"
          );
          
          // Clear just this month
          return await cacheStorage.clearMonthlyCache(
            source === 'all' ? undefined : source as CacheSource,
            startInfo.year,
            startInfo.month
          );
        }
      } 
      
      // For non-month-aligned cases, use the traditional approach
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

      // For the monthly approach, use the monthly_cache ID if the request is for exactly one month
      const startInfo = this.getYearAndMonth(startDate);
      const endInfo = this.getYearAndMonth(endDate);
      
      if (
        startInfo.year === endInfo.year &&
        startInfo.month === endInfo.month &&
        startDate.getDate() === 1 &&
        endDate.getDate() === new Date(endInfo.year, endInfo.month, 0).getDate()
      ) {
        // Get monthly cache information
        const monthlyCacheInfo = await cacheStorage.getMonthCacheInfo(
          source,
          startInfo.year,
          startInfo.month
        );
        
        return monthlyCacheInfo?.id || null;
      }
      
      // Fallback to legacy method for complex date ranges
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
