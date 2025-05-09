
// Define the structure for cache status information
export interface CacheStatus {
  usingCachedData: boolean;
  partialRefresh: boolean;
  stats: CacheStats | null;
  lastRefresh?: Date | null;
  refreshAttempts?: number;
  lastRefreshAttempt?: Date;
}

// Add CacheStats type if not already defined
export interface CacheStats {
  cachedCount?: number;
  newCount?: number;
  totalCount?: number;
  lastRefresh?: string;
}

// Define cache control settings to prevent excessive refreshes
export interface CacheControl {
  maxRefreshesPerSession: number;
  minRefreshInterval: number;
  refreshCount: number;
  lastRefreshTime: number;
}
