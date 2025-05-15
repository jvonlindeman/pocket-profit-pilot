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

// Update the CacheEvent type to include 'clear'
export type CacheEvent = 
  | 'hit' 
  | 'miss' 
  | 'check' 
  | 'store' 
  | 'api_call' 
  | 'force_refresh'
  | 'clear';

export interface CacheContextType {
  status: CacheStatus;
  logCacheEvent: (event: CacheEvent, source: CacheSource, details?: CacheEventDetails) => void;
  clearCache: (options?: CacheClearOptions) => boolean;
  isUsingCache: boolean;
  setIsUsingCache: (isUsing: boolean) => void;
  refreshStats: () => void;
}
