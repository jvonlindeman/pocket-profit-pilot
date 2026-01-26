import { useCallback } from 'react';

/**
 * Stub hook for cache segment operations
 * Returns default values since we no longer use persistent cache
 */
export const useCacheSegments = () => {
  /**
   * Get cache segment IDs - stub that returns null
   */
  const getCacheSegmentIds = useCallback(async (dateRange: { startDate: Date; endDate: Date }) => {
    return { zoho: null, stripe: null };
  }, []);
  
  /**
   * Check cache for a specific source - stub that returns not cached
   */
  const checkSourceCache = useCallback(async (
    source: string,
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false
  ) => {
    return {
      cached: false,
      status: "no_cache",
      partial: false,
    };
  }, []);
  
  /**
   * Force refresh cache - stub that returns false
   */
  const refreshSourceCache = useCallback(async (
    source: string,
    dateRange: { startDate: Date; endDate: Date }
  ) => {
    return false;
  }, []);

  return { 
    getCacheSegmentIds,
    checkSourceCache,
    refreshSourceCache
  };
};
