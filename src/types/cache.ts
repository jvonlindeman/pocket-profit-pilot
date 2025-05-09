
/**
 * Types related to cache management
 */

export interface CacheStats {
  cachedCount: number;
  newCount: number;
  totalCount?: number;
  isFresh?: boolean;
  fullCoverage?: boolean;
  partialRefreshAttempted?: boolean;
  partialRefreshSuccess?: boolean;
  cachedDateRange?: {
    start: string;
    end: string;
  };
  lastRefresh?: string | null;
}

export interface CacheStatus {
  usingCachedData: boolean;
  partialRefresh: boolean;
  stats: CacheStats | null;
  lastRefresh: Date | null;
  refreshAttempts?: number; // Track number of refresh attempts
  lastRefreshAttempt?: Date; // Track time of last refresh attempt
}

export interface CacheControl {
  maxRefreshesPerSession: number;
  minRefreshInterval: number; // in milliseconds
  refreshCount: number;
  lastRefreshTime: number;
}
