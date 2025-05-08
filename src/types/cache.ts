
/**
 * Types related to cache management
 */

export interface CacheStats {
  cachedCount: number;
  newCount: number;
  totalCount: number;
}

export interface CacheStatus {
  usingCachedData: boolean;
  partialRefresh: boolean;
  stats: CacheStats | null;
  lastRefresh: Date | null;
}
