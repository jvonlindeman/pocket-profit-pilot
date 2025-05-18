
import { useCallback } from 'react';
import CacheService from '@/services/cache';

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

  return { getCacheSegmentIds };
};
