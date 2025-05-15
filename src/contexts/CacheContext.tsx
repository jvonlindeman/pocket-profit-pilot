import React, { 
  createContext, 
  useState, 
  useContext, 
  useCallback,
  useEffect,
  useRef
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import * as ZohoService from '@/services/zohoService';
import * as StripeService from '@/services/stripeService';
import { CacheEvent } from '@/types/cache';

// Define the shape of the cache status
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

// Define the context type
interface CacheContextType {
  status: CacheStatus;
  isUsingCache: boolean;
  logCacheEvent: (event: CacheEvent, source: string, details?: any) => void;
  clearCache: (options?: CacheClearOptions) => boolean;
  refreshStats: () => void;
}

// Options for clearing the cache
interface CacheClearOptions {
  source?: 'zoho' | 'stripe' | 'all';
  startDate?: Date;
  endDate?: Date;
}

// Create the context with a default value
const CacheContext = createContext<CacheContextType>({
  status: {
    zoho: { hit: false, miss: false, partial: false },
    stripe: { hit: false, miss: false, partial: false }
  },
  isUsingCache: false,
  logCacheEvent: () => {},
  clearCache: () => true,
  refreshStats: () => {},
});

// Provider component
interface CacheProviderProps {
  children: React.ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [isUsingCache, setIsUsingCache] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    zoho: { hit: false, miss: false, partial: false },
    stripe: { hit: false, miss: false, partial: false }
  });
  const { toast } = useToast();
  
  // Use useRef to hold the previous values
  const previousCacheStatus = useRef<CacheStatus>({
    zoho: { hit: false, miss: false, partial: false },
    stripe: { hit: false, miss: false, partial: false }
  });
  
  // Function to refresh cache stats
  const refreshStats = useCallback(() => {
    const zohoCache = ZohoService.getCacheStatus();
    const stripeCache = StripeService.getCacheStatus();
    
    const newCacheStatus: CacheStatus = {
      zoho: {
        hit: zohoCache.hit,
        miss: zohoCache.miss,
        partial: zohoCache.partial || false,
      },
      stripe: {
        hit: stripeCache.hit,
        miss: stripeCache.miss,
        partial: stripeCache.partial || false,
      },
    };
    
    setCacheStatus(newCacheStatus);
  }, []);
  
  // Effect to run refreshStats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);
  
  // Effect to compare current and previous cache status
  useEffect(() => {
    // Function to compare two cache statuses
    const hasStatusChanged = (prev: CacheStatus, current: CacheStatus): boolean => {
      return (
        prev.zoho.hit !== current.zoho.hit ||
        prev.zoho.miss !== current.zoho.miss ||
        prev.zoho.partial !== current.zoho.partial ||
        prev.stripe.hit !== current.stripe.hit ||
        prev.stripe.miss !== current.stripe.miss ||
        prev.stripe.partial !== current.stripe.partial
      );
    };
    
    // Check if the cache status has changed
    if (hasStatusChanged(previousCacheStatus.current, cacheStatus)) {
      console.log('Cache status changed:', {
        previous: previousCacheStatus.current,
        current: cacheStatus,
      });
      
      // Show toast notifications based on cache status
      if (cacheStatus.zoho.hit && !previousCacheStatus.current.zoho.hit) {
        toast({
          title: "Zoho Cache Hit",
          description: "Data retrieved from Zoho cache.",
        });
      }
      if (cacheStatus.zoho.miss && !previousCacheStatus.current.zoho.miss) {
        toast({
          title: "Zoho Cache Miss",
          description: "Data retrieved from Zoho API.",
        });
      }
      if (cacheStatus.stripe.hit && !previousCacheStatus.current.stripe.hit) {
        toast({
          title: "Stripe Cache Hit",
          description: "Data retrieved from Stripe cache.",
        });
      }
      if (cacheStatus.stripe.miss && !previousCacheStatus.current.stripe.miss) {
        toast({
          title: "Stripe Cache Miss",
          description: "Data retrieved from Stripe API.",
        });
      }
      
      // Update the previousCacheStatus ref
      previousCacheStatus.current = cacheStatus;
    }
  }, [cacheStatus, toast]);
  
  // Function to log cache events
  const logCacheEvent = useCallback((event: CacheEvent, source: string, details?: any) => {
    console.log(`Cache event: ${event} from ${source}`, details || '');
  }, []);
  
  // Function to clear Zoho cache
  const clearZohoCache = useCallback(() => {
    ZohoService.clearCache();
    console.log('Zoho cache cleared');
  }, []);
  
  // Function to clear Stripe cache
  const clearStripeCache = useCallback(() => {
    StripeService.clearCache();
    console.log('Stripe cache cleared');
  }, []);
  
  // Function to clear all cache
  const clearAllCache = useCallback(() => {
    clearZohoCache();
    clearStripeCache();
    console.log('All cache cleared');
  }, [clearZohoCache, clearStripeCache]);
  
  // Function to clear cache with options
  const clearCache = (options?: CacheClearOptions) => {
    try {
      console.log('Clearing cache with options:', options);
      
      // Clear the cache based on options
      if (options?.source === 'zoho') {
        clearZohoCache();
      } else if (options?.source === 'stripe') {
        clearStripeCache();
      } else {
        clearAllCache();
      }
      
      setIsUsingCache(false);
      refreshStats();
      
      // Log cache clear event with the correct type
      logCacheEvent('clear', (options?.source || 'all'), {
        startDate: options?.startDate,
        endDate: options?.endDate
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  };
  
  // Check if "cache=false" is in the URL, disable cache
  useEffect(() => {
    if (searchParams.get("cache") === "false") {
      console.warn("Cache has been disabled via URL parameter.");
      setIsUsingCache(false);
    } else {
      setIsUsingCache(true);
    }
  }, [searchParams, setIsUsingCache]);
  
  const value: CacheContextType = {
    status: cacheStatus,
    isUsingCache,
    logCacheEvent,
    clearCache,
    refreshStats,
  };
  
  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

// Hook to consume the context
export const useCacheContext = () => useContext(CacheContext);
