
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CacheResponse, CacheStats } from '@/services/cache/cacheTypes';
import cacheService from '@/services/cache';
import { logCacheEvent } from '@/components/Dashboard/CacheMonitor';

// Define the context state type
interface CacheContextState {
  // Cache status
  status: {
    zoho: { hit: boolean; partial: boolean };
    stripe: { hit: boolean; partial: boolean };
  };
  isUsingCache: boolean;
  lastCheckResult: CacheResponse | null;
  
  // Cache stats
  stats: CacheStats | null;
  
  // Cache operations
  checkCache: (source: string, startDate: Date, endDate: Date, forceRefresh?: boolean) => Promise<CacheResponse>;
  storeTransactions: (source: string, startDate: Date, endDate: Date, transactions: any[]) => Promise<boolean>;
  refreshStats: () => Promise<void>;
  clearCache: (options?: { source?: 'Zoho' | 'Stripe' | 'all'; startDate?: Date; endDate?: Date }) => Promise<boolean>;
  verifyCacheIntegrity: (source: string, startDate: Date, endDate: Date) => Promise<{ isConsistent: boolean, segmentCount: number, transactionCount: number }>;
}

// Create the context with default values
export const CacheContext = createContext<CacheContextState>({
  status: {
    zoho: { hit: false, partial: false },
    stripe: { hit: false, partial: false }
  },
  isUsingCache: false,
  lastCheckResult: null,
  stats: null,
  
  // Default implementations that will be overridden by the provider
  checkCache: async () => ({ cached: false, status: 'not_initialized' }),
  storeTransactions: async () => false,
  refreshStats: async () => {},
  clearCache: async () => false,
  verifyCacheIntegrity: async () => ({ isConsistent: false, segmentCount: 0, transactionCount: 0 })
});

// Provider component
export const CacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for cache status
  const [cacheStatus, setCacheStatus] = useState<CacheContextState['status']>({
    zoho: { hit: false, partial: false },
    stripe: { hit: false, partial: false }
  });
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<CacheResponse | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);
  
  // Load initial cache stats
  useEffect(() => {
    refreshStats();
  }, []);
  
  // Function to refresh cache stats
  const refreshStats = async () => {
    try {
      const cacheStats = await cacheService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
    }
  };
  
  // Enhanced check cache function
  const checkCache = async (
    source: string,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse> => {
    try {
      const result = await cacheService.checkCache(source, startDate, endDate, forceRefresh);
      setLastCheckResult(result);
      
      // Update cache status based on source
      if (source === 'Zoho') {
        setCacheStatus(prev => ({
          ...prev,
          zoho: { hit: result.cached, partial: result.partial || false }
        }));
      } else if (source === 'Stripe') {
        setCacheStatus(prev => ({
          ...prev,
          stripe: { hit: result.cached, partial: result.partial || false }
        }));
      }
      
      // Update global cache usage status
      const newIsUsingCache = result.cached || cacheStatus.zoho.hit || cacheStatus.stripe.hit;
      setIsUsingCache(newIsUsingCache);
      
      return result;
    } catch (error) {
      console.error(`Error checking ${source} cache:`, error);
      return { cached: false, status: 'error' };
    }
  };
  
  // Store transactions function
  const storeTransactions = async (
    source: string,
    startDate: Date,
    endDate: Date,
    transactions: any[]
  ): Promise<boolean> => {
    const result = await cacheService.storeTransactions(source, startDate, endDate, transactions);
    
    // Refresh stats after storing new transactions
    if (result) {
      refreshStats();
    }
    
    return result;
  };
  
  // Clear cache function
  const clearCache = async (
    options?: { source?: 'Zoho' | 'Stripe' | 'all'; startDate?: Date; endDate?: Date }
  ): Promise<boolean> => {
    const result = await cacheService.clearCache(options);
    
    // Reset cache status if cleared successfully
    if (result) {
      if (!options?.source || options.source === 'all') {
        setCacheStatus({
          zoho: { hit: false, partial: false },
          stripe: { hit: false, partial: false }
        });
      } else if (options.source === 'Zoho') {
        setCacheStatus(prev => ({
          ...prev,
          zoho: { hit: false, partial: false }
        }));
      } else if (options.source === 'Stripe') {
        setCacheStatus(prev => ({
          ...prev,
          stripe: { hit: false, partial: false }
        }));
      }
      
      setIsUsingCache(false);
      refreshStats();
      
      // Fix: Update the logCacheEvent call to handle 'clear' type
      // @ts-ignore - We will update the type definitions in the next step
      logCacheEvent('clear', (options?.source || 'all'), {
        startDate: options?.startDate,
        endDate: options?.endDate
      });
    }
    
    return result;
  };
  
  // Verify cache integrity function
  const verifyCacheIntegrity = async (
    source: string,
    startDate: Date,
    endDate: Date
  ) => {
    return await cacheService.verifyCacheIntegrity(source, startDate, endDate);
  };
  
  // Prepare context value
  const contextValue: CacheContextState = {
    status: cacheStatus,
    isUsingCache,
    lastCheckResult,
    stats,
    checkCache,
    storeTransactions,
    refreshStats,
    clearCache,
    verifyCacheIntegrity
  };
  
  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

// Hook for using cache context
export const useCacheContext = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext must be used within a CacheProvider');
  }
  return context;
};
