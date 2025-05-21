
import { cacheStorage } from "../storage";
import { cacheMetrics } from "../metrics";
import { CacheSource } from "../types";

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
    month: date.getMonth() + 1 // JavaScript months are 0-indexed
  };
};

/**
 * Clear cache
 */
export const clearCache = async (options?: {
  source?: CacheSource | 'all';
  startDate?: Date;
  endDate?: Date;
}): Promise<boolean> => {
  try {
    const source = options?.source || 'all';
    let formattedStartDate: string | undefined;
    let formattedEndDate: string | undefined;
    
    if (options?.startDate && options?.endDate) {
      formattedStartDate = formatDate(options.startDate);
      formattedEndDate = formatDate(options.endDate);
      
      // If this is a full month, use the monthly approach
      const startInfo = getYearAndMonth(options.startDate);
      const endInfo = getYearAndMonth(options.endDate);
      
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
};
