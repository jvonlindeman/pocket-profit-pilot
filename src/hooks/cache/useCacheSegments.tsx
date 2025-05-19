
import { useCallback } from 'react';
import CacheService, { CacheSource } from '@/services/cache';

/**
 * Hook to handle cache segment related operations
 */
export const useCacheSegments = () => {
  /**
   * Get cache segment IDs for the current date range
   */
  const getCacheSegmentIds = useCallback(async (dateRange: { startDate: Date; endDate: Date }) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      console.log("Cannot get cache segment IDs without date range");
      return { zoho: null, stripe: null };
    }

    try {
      // Try to get the cache segment ID for Zoho
      const zohoSegmentId = await CacheService.getCacheSegmentId(
        'Zoho',
        dateRange.startDate,
        dateRange.endDate
      );
      
      // Try to get the cache segment ID for Stripe
      const stripeSegmentId = await CacheService.getCacheSegmentId(
        'Stripe',
        dateRange.startDate,
        dateRange.endDate
      );
      
      console.log(`Retrieved cache segment IDs - Zoho: ${zohoSegmentId || 'none'}, Stripe: ${stripeSegmentId || 'none'}`);
      return { zoho: zohoSegmentId, stripe: stripeSegmentId };
    } catch (err) {
      console.error("Error retrieving cache segment IDs:", err);
      return { zoho: null, stripe: null };
    }
  }, []);
  
  /**
   * Check cache for a specific source
   */
  const checkSourceCache = useCallback(async (
    source: CacheSource,
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false
  ) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      console.log(`Cannot check ${source} cache without date range`);
      return {
        cached: false,
        status: "missing_date_range",
        partial: false,
      };
    }
    
    try {
      return await CacheService.checkCache(
        source,
        dateRange.startDate,
        dateRange.endDate,
        forceRefresh
      );
    } catch (err) {
      console.error(`Error checking ${source} cache:`, err);
      return {
        cached: false,
        status: "error",
        partial: false,
      };
    }
  }, []);
  
  /**
   * Force refresh cache for a data source
   */
  const refreshSourceCache = useCallback(async (
    source: CacheSource,
    dateRange: { startDate: Date; endDate: Date }
  ) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      console.log(`Cannot refresh ${source} cache without date range`);
      return false;
    }
    
    try {
      return await CacheService.refreshCache(
        source,
        dateRange.startDate,
        dateRange.endDate
      );
    } catch (err) {
      console.error(`Error refreshing ${source} cache:`, err);
      return false;
    }
  }, []);

  return { 
    getCacheSegmentIds,
    checkSourceCache,
    refreshSourceCache
  };
};
