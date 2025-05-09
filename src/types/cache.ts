// Define the structure for cache status information
export interface CacheStatus {
  usingCachedData: boolean;
  partialRefresh: boolean;
  stats: CacheStats | null;
}

// Add CacheStats type if not already defined
export interface CacheStats {
  cachedCount?: number;
  newCount?: number;
  totalCount?: number;
  lastRefresh?: string;
}
