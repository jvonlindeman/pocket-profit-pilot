import { Json } from "../../integrations/supabase/types";
import { Transaction } from "../../types/financial";

/**
 * Cache source.
 * Defines the possible sources for cached data.
 */
export type CacheSource = "Zoho" | "Stripe";

/**
 * Cache result.
 * Defines the possible results of a cache operation.
 */
export type CacheResult = "hit" | "miss" | "partial" | "error" | "force_refresh";

/**
 * Cache response.
 * Defines the structure of a cache response, including whether the data was cached,
 * the status of the cache, any data returned, and any missing ranges.
 */
export interface CacheResponse {
  cached: boolean;
  status: string;
  data?: Transaction[];
  partial: boolean;
  missingRanges?: { startDate: string; endDate: string }[];
  metrics?: CacheMetrics;
}

/**
 * Cache metrics.
 * Defines the structure for cache metrics, including the source, start and end dates,
 * transaction count, and cache hit status.
 */
export interface CacheMetrics {
  source: CacheSource;
  startDate: string;
  endDate: string;
  transactionCount?: number;
  cacheHit: boolean;
  partialHit: boolean;
}

/**
 * Detailed cache statistics
 */
export interface DetailedCacheStats {
  totalTransactions: number;
  transactionsBySource: Record<string, number>;
  monthlyCache: Record<string, any[]>;
  segments: Record<string, any[]>;
  transactionsByMonth: Record<string, Record<string, number>>;
  sourcesStats?: CacheSourceStats[];
  lastUpdated: string;
}

/**
 * Cache clear options
 */
export interface CacheClearOptions {
  source?: CacheSource | 'all';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Cache source statistics
 */
export interface CacheSourceStats {
  source: string;
  count: number;
  monthlyData: any[];
  segments: any[];
}

/**
 * Cache integrity check result
 */
export interface CacheIntegrityResult {
  isConsistent: boolean;
  segmentCount: number;
  transactionCount: number;
}

/**
 * Cache segment information
 */
export interface CacheSegmentInfo {
  id: string;
  transaction_count: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  transactionCount?: number;
  segments?: Array<{ source: string; count: number; total: number }>;
  recentMetrics?: any[];
  hitRate?: string;
  hits?: number;
  misses?: number;
  lastUpdated: string;
}
