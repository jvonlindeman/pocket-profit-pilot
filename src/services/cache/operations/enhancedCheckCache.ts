
import { Transaction } from "../../../types/financial";
import { CacheSource, CacheResponse } from "../types";
import { monthlyStorage } from "../storage/monthlyStorage";
import { dataIntegrityValidator } from "../validation/dataIntegrity";
import { startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from "date-fns";

/**
 * Enhanced cache checking with better data retrieval and validation
 */
export class EnhancedCacheChecker {
  /**
   * Check cache with enhanced data retrieval and validation
   */
  static async checkCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse> {
    console.log(`[ENHANCED_CACHE_CHECK] Starting enhanced cache check for ${source}`, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      forceRefresh
    });

    try {
      // If force refresh, return immediate miss
      if (forceRefresh) {
        console.log(`[ENHANCED_CACHE_CHECK] Force refresh requested - returning cache miss`);
        return {
          cached: false,
          status: "force_refresh",
          partial: false,
          data: []
        };
      }

      // Determine if this is a single month request
      const isSingleMonth = isSameMonth(startDate, endDate) && 
                           startDate.getDate() === 1 && 
                           endDate >= endOfMonth(startDate);

      if (isSingleMonth) {
        return this.checkSingleMonthCache(source, startDate);
      } else {
        return this.checkMultiMonthCache(source, startDate, endDate);
      }

    } catch (error) {
      console.error(`[ENHANCED_CACHE_CHECK] Exception during cache check:`, error);
      return {
        cached: false,
        status: "error",
        partial: false,
        data: []
      };
    }
  }

  /**
   * Check cache for a single month
   */
  private static async checkSingleMonthCache(
    source: CacheSource,
    date: Date
  ): Promise<CacheResponse> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    console.log(`[ENHANCED_CACHE_CHECK] Checking single month cache: ${source} ${year}/${month}`);

    try {
      // Check if month is cached
      const cacheInfo = await monthlyStorage.isMonthCached(source, year, month);
      
      if (!cacheInfo.isCached || cacheInfo.transactionCount === 0) {
        console.log(`[ENHANCED_CACHE_CHECK] Month not cached or empty: ${source} ${year}/${month}`);
        return {
          cached: false,
          status: "miss",
          partial: false,
          data: []
        };
      }

      // Retrieve cached transactions
      const transactions = await monthlyStorage.getMonthTransactions(source, year, month);

      if (transactions.length === 0) {
        console.log(`[ENHANCED_CACHE_CHECK] No transactions retrieved despite cache indicating data exists`);
        return {
          cached: false,
          status: "empty_cache",
          partial: false,
          data: []
        };
      }

      // Validate retrieved data
      const validation = dataIntegrityValidator.validateTransactionBatch(transactions);
      
      if (validation.invalid.length > 0) {
        console.warn(`[ENHANCED_CACHE_CHECK] Found ${validation.invalid.length} invalid cached transactions`);
      }

      console.log(`[ENHANCED_CACHE_CHECK] Single month cache HIT: ${source} ${year}/${month}`, {
        expectedCount: cacheInfo.transactionCount,
        retrievedCount: transactions.length,
        validCount: validation.valid.length
      });

      return {
        cached: true,
        status: "hit",
        partial: false,
        data: validation.valid.length > 0 ? validation.valid : transactions
      };

    } catch (error) {
      console.error(`[ENHANCED_CACHE_CHECK] Error checking single month cache:`, error);
      return {
        cached: false,
        status: "error",
        partial: false,
        data: []
      };
    }
  }

  /**
   * Check cache for multiple months
   */
  private static async checkMultiMonthCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<CacheResponse> {
    console.log(`[ENHANCED_CACHE_CHECK] Checking multi-month cache: ${source}`);

    try {
      // Get all months in the range
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      let allTransactions: Transaction[] = [];
      let hasPartialData = false;
      let hasCachedData = false;

      // Check each month
      for (const monthDate of months) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1;

        const cacheInfo = await monthlyStorage.isMonthCached(source, year, month);

        if (cacheInfo.isCached && cacheInfo.transactionCount > 0) {
          const monthTransactions = await monthlyStorage.getMonthTransactions(source, year, month);
          
          // Filter transactions to the requested date range
          const filteredTransactions = monthTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startDate && txDate <= endDate;
          });

          allTransactions = [...allTransactions, ...filteredTransactions];
          hasCachedData = true;

          console.log(`[ENHANCED_CACHE_CHECK] Month ${year}/${month}: ${filteredTransactions.length} transactions in range`);
        } else {
          hasPartialData = true;
          console.log(`[ENHANCED_CACHE_CHECK] Month ${year}/${month}: No cached data`);
        }
      }

      if (!hasCachedData) {
        console.log(`[ENHANCED_CACHE_CHECK] Multi-month cache MISS: No cached data found`);
        return {
          cached: false,
          status: "miss",
          partial: false,
          data: []
        };
      }

      if (hasPartialData) {
        console.log(`[ENHANCED_CACHE_CHECK] Multi-month cache PARTIAL: ${allTransactions.length} transactions`);
        return {
          cached: true,
          status: "partial_hit",
          partial: true,
          data: allTransactions
        };
      }

      console.log(`[ENHANCED_CACHE_CHECK] Multi-month cache HIT: ${allTransactions.length} transactions`);
      return {
        cached: true,
        status: "hit",
        partial: false,
        data: allTransactions
      };

    } catch (error) {
      console.error(`[ENHANCED_CACHE_CHECK] Error checking multi-month cache:`, error);
      return {
        cached: false,
        status: "error",
        partial: false,
        data: []
      };
    }
  }
}

export const enhancedCacheChecker = new EnhancedCacheChecker();
