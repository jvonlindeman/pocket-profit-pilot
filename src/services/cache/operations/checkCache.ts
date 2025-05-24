
import { Transaction } from "../../../types/financial";
import { cacheStorage } from "../storage";
import { cacheMetrics } from "../metrics";
import { CacheResponse, CacheSource } from "../types";
import { supabase } from "../../../integrations/supabase/client";
import { monthlyStorage } from "../storage/monthlyStorage";

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
 * Check cache for transactions with improved detection using PostgreSQL function
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

  console.log(`[CACHE_CHECK_DEBUG] Checking cache for ${source} from ${formattedStartDate} to ${formattedEndDate}`, {
    startInfo,
    endInfo,
    forceRefresh
  });

  // Prepare response for API error cases
  const errorResponse: CacheResponse = {
    cached: false,
    status: "error",
    partial: false,
  };

  try {
    // If force refresh, skip cache check
    if (forceRefresh) {
      console.log(`[CACHE_CHECK_DEBUG] Force refresh requested, skipping cache check`);
      
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
      console.log(`[CACHE_CHECK_DEBUG] Single month request detected: ${startInfo.year}/${startInfo.month}`);
      
      // Use the improved PostgreSQL function via direct RPC call for better reliability
      const { data: cacheResult, error } = await supabase
        .rpc('is_month_cached', {
          p_source: source,
          p_year: startInfo.year,
          p_month: startInfo.month
        });
      
      if (error) {
        console.error(`[CACHE_CHECK_DEBUG] Error calling is_month_cached RPC:`, error);
        // Fallback to monthlyStorage method
        const fallbackResult = await monthlyStorage.isMonthCached(
          source, 
          startInfo.year, 
          startInfo.month
        );
        
        if (fallbackResult.isCached && fallbackResult.transactionCount > 0) {
          console.log(`[CACHE_CHECK_DEBUG] Cache HIT (fallback) - Found ${fallbackResult.transactionCount} transactions`);
          
          const transactions = await monthlyStorage.getMonthTransactions(
            source,
            startInfo.year,
            startInfo.month
          );
          
          await cacheMetrics.recordCacheAccess(
            source,
            formattedStartDate,
            formattedEndDate,
            true,
            false,
            transactions.length
          );
          
          return {
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
        }
      } else if (cacheResult && cacheResult.length > 0) {
        const cacheResultItem = cacheResult[0];
        console.log(`[CACHE_CHECK_DEBUG] PostgreSQL RPC result:`, cacheResultItem);
        
        if (cacheResultItem.is_cached && cacheResultItem.transaction_count > 0) {
          console.log(`[CACHE_CHECK_DEBUG] Cache HIT (PostgreSQL) - Found ${cacheResultItem.transaction_count} transactions`);
          
          // Get transactions for this month
          const transactions = await monthlyStorage.getMonthTransactions(
            source,
            startInfo.year,
            startInfo.month
          );
          
          console.log(`[CACHE_CHECK_DEBUG] Retrieved ${transactions.length} transactions from cache`);
          
          // Record the cache hit
          await cacheMetrics.recordCacheAccess(
            source,
            formattedStartDate,
            formattedEndDate,
            true,
            false,
            transactions.length
          );
          
          const response: CacheResponse = {
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
          
          return response;
        }
      }
      
      // No cache found
      console.log(`[CACHE_CHECK_DEBUG] Cache MISS - No cached data found for ${startInfo.year}/${startInfo.month}`);
      
      // Record the cache miss
      await cacheMetrics.recordCacheAccess(
        source,
        formattedStartDate,
        formattedEndDate,
        false,
        false,
        0
      );
      
      const missResponse: CacheResponse = {
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
      
      return missResponse;
    } 
    else {
      console.log(`[CACHE_CHECK_DEBUG] Complex date range detected, using cache-manager edge function`);
      
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
        console.error("[CACHE_CHECK_DEBUG] Error calling cache-manager:", error);
        return errorResponse;
      }
      
      if (!data) {
        console.error("[CACHE_CHECK_DEBUG] No data returned from cache-manager");
        return errorResponse;
      }
      
      console.log(`[CACHE_CHECK_DEBUG] Cache-manager response:`, data);
      
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
    console.error("[CACHE_CHECK_DEBUG] Exception checking cache:", err);
    return errorResponse;
  }
};
