
export interface CacheStatus {
  zoho: {
    hit: boolean;
    miss: boolean;
	partial: boolean;
  };
  stripe: {
    hit: boolean;
    miss: boolean;
	partial: boolean;
  };
}

export interface CacheEventDetails {
  startDate?: Date;
  endDate?: Date;
  [key: string]: any;
}

export type CacheSource = 'zoho' | 'stripe' | 'all';

export interface CacheClearOptions {
  source?: CacheSource;
  startDate?: Date;
  endDate?: Date;
}

// Define CacheEvent as an interface instead of a string union
export interface CacheEvent {
  id: string;
  type: 'hit' | 'miss' | 'check' | 'store' | 'api_call' | 'force_refresh' | 'clear';
  source: string;
  timestamp: Date;
  dateRange?: { 
    startDate: Date; 
    endDate: Date 
  };
  details?: any;
  durationMs?: number;
}

// Define CacheMetrics for the CacheSummary component
export interface CacheMetrics {
  hits: number;
  misses: number;
  apiCalls: number;
  zohoHits: number;
  zohoMisses: number;
  stripeHits: number;
  stripeMisses: number;
  averageDuration: number;
}

export interface CacheContextType {
  status: CacheStatus;
  logCacheEvent: (event: 'hit' | 'miss' | 'check' | 'store' | 'api_call' | 'force_refresh' | 'clear', source: CacheSource, details?: CacheEventDetails) => void;
  clearCache: (options?: CacheClearOptions) => boolean;
  isUsingCache: boolean;
  setIsUsingCache: (isUsing: boolean) => void;
  refreshStats: () => void;
  checkCache?: (source: string, startDate: Date, endDate: Date, forceRefresh?: boolean) => Promise<{cached: boolean}>;
  storeTransactions?: (source: string, startDate: Date, endDate: Date, data: any[]) => Promise<void>;
  verifyCacheIntegrity?: (source: string, startDate: Date, endDate: Date) => Promise<void>;
}
