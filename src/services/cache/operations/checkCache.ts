
import { Transaction } from "../../../types/financial";
import { cacheStorage } from "../storage";
import { cacheMetrics } from "../metrics";
import { CacheResponse, CacheSource } from "../types";
import { supabase } from "../../../integrations/supabase/client";

/**
 * Format a date for API use
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Extract year and month from date
 */
const getYearAndMonth = (date: Date): { year: number, month: number } => {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1 // JavaScript months are 0-indexed, add 1 to match SQL conventions
  };
};

/**
 * Check cache for transactions
 */
export const checkCache = async (
  source: CacheSource,
  startDate: Date,
  endDate: Date,
  forceRefresh = false
): Promise<CacheResponse> => {
  // Format dates for API
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
  // Extract year and month from dates
  const startInfo = getYearAndMonth(startDate);
  const endInfo = getYearAndMonth(endDate);

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
      
      return cacheResponse;
    }
  } catch (err) {
    console.error("Exception checking cache:", err);
    return errorResponse;
  }
};
