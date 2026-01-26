/**
 * Stub hook for cache status - always returns not cached
 * Since we removed the persistent cache system, this returns defaults
 */

export const cacheStatusKeys = {
  all: ["cache-status"] as const,
  byDateRange: (startDate: Date, endDate: Date) => 
    [...cacheStatusKeys.all, startDate.toISOString(), endDate.toISOString()] as const,
};

export interface CacheStatusData {
  zoho: {
    cached: boolean;
    partial: boolean;
  };
  stripe: {
    cached: boolean;
    partial: boolean;
  };
}

export function useCacheStatus(
  startDate: Date,
  endDate: Date,
  options: { enabled?: boolean } = {}
) {
  // Return a static result since we no longer use persistent cache
  return {
    data: {
      zoho: { cached: false, partial: false },
      stripe: { cached: false, partial: false }
    } as CacheStatusData,
    isLoading: false,
    isError: false,
    error: null
  };
}
