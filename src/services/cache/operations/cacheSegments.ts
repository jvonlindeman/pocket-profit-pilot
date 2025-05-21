
import { cacheStorage } from "../storage";
import { cacheMetrics } from "../metrics";
import { CacheSource } from "../types";
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
    month: date.getMonth() + 1 // JavaScript months are 0-indexed
  };
};

/**
 * Get cache segment ID for a date range
 */
export const getCacheSegmentId = async (
  source: CacheSource,
  startDate: Date,
  endDate: Date
): Promise<string | null> => {
  try {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // For the monthly approach, use the monthly_cache ID if the request is for exactly one month
    const startInfo = getYearAndMonth(startDate);
    const endInfo = getYearAndMonth(endDate);
    
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
};

/**
 * Refresh cache data for a date range
 */
export const refreshCache = async (
  source: CacheSource,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  // Format dates for API
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
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
};

/**
 * Repair cache segments to match actual transaction counts
 * This ensures consistency between segment metadata and actual data
 */
export const repairCacheSegments = async (
  source: CacheSource,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  try {
    // Format dates for API
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    // For the monthly approach, if this is exactly one month,
    // we can repair just that month's cache
    const startInfo = getYearAndMonth(startDate);
    const endInfo = getYearAndMonth(endDate);
    
    if (
      startInfo.year === endInfo.year &&
      startInfo.month === endInfo.month
    ) {
      // Get the actual transaction count for this month
      const { data, error } = await supabase
        .from('cached_transactions')
        .select('id', { count: 'exact' })
        .eq('source', source)
        .eq('year', startInfo.year)
        .eq('month', startInfo.month);
        
      if (error) {
        console.error("Error counting transactions for repair:", error);
        return false;
      }
      
      const actualCount = data?.length || 0;
      
      // Update the monthly cache with the correct count
      const { error: updateError } = await supabase
        .from('monthly_cache')
        .upsert({
          source,
          year: startInfo.year,
          month: startInfo.month,
          transaction_count: actualCount,
          status: 'complete',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'source,year,month'
        });
        
      if (updateError) {
        console.error("Error updating monthly cache during repair:", updateError);
        return false;
      }
      
      // Record the operation
      await cacheMetrics.recordCacheOperation(
        source,
        formattedStartDate,
        formattedEndDate,
        "repair"
      );
      
      return true;
    }
    
    // For complex date ranges, call the legacy repair method
    // Note: We'd need to implement this for non-month-aligned date ranges
    // This is a stub implementation
    console.log(`Repairing complex date range not fully implemented: ${source} ${formattedStartDate} to ${formattedEndDate}`);
    return false;
  } catch (err) {
    console.error("Exception repairing cache segments:", err);
    return false;
  }
};
