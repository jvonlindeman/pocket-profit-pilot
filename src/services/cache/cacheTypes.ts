
import { Transaction } from "../../types/financial";

// Cache check response from the edge function
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

// Result of a cache operation provided to consumers
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

// Cache statistics used in the admin dashboard
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
