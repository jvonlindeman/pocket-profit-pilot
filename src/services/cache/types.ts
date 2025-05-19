
/**
 * Core cache types used throughout the cache system
 */

// Base cache response from edge function
export interface CacheResponse {
  cached: boolean;
  status: string;
  data?: Transaction[];
  partial?: boolean;
  missingRanges?: {
    startDate: string | null;
    endDate: string | null;
  };
  metrics?: {
    source: string;
    startDate: string;
    endDate: string;
    transactionCount?: number;
    fetchDuration?: number;
    cacheHit: boolean;
    partialHit?: boolean;
  };
}

// Result of cache operations provided to consumers
export interface CacheResult {
  transactions: Transaction[];
  isCached: boolean;
  isPartialCache: boolean;
  missingRanges?: {
    startDate: string | null;
    endDate: string | null;
  };
  metrics?: {
    source: string;
    startDate: string;
    endDate: string;
    transactionCount: number;
    fetchDuration: number;
  };
}

// Cache integrity verification result
export interface CacheIntegrityResult {
  isConsistent: boolean;
  segmentCount: number;
  transactionCount: number;
}

// Cache segment information
export interface CacheSegmentInfo {
  id: string;
  transaction_count: number;
}

// Cache clear options
export interface CacheClearOptions {
  source?: 'Zoho' | 'Stripe' | 'all';
  startDate?: Date;
  endDate?: Date;
}

// Cache segment statistics by source
export interface CacheSourceStats {
  source: string;
  count: number;
}

// Detailed cache statistics
export interface DetailedCacheStats {
  transactions: CacheSourceStats[];
  segments: CacheSourceStats[];
}

// Cache statistics used in admin dashboard
export interface CacheStats {
  transactionCount: number;
  segments: {
    source: string;
    count: number;
    total: number;
  }[];
  recentMetrics: any[];
  hitRate: string;
  hits: number;
  misses: number;
  lastUpdated: string;
}

// Cache status for UI components
export interface CacheStatus {
  zoho: { hit: boolean; partial: boolean };
  stripe: { hit: boolean; partial: boolean };
}

// Import Transaction type from the financial types
import { Transaction } from "../../types/financial";
