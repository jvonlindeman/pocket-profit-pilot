
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import CacheService from '@/services/cache';

interface CacheContextState {
  isCacheEnabled: boolean;
  toggleCache: () => void;
  forceCacheRefresh: () => void;
  cacheStats: any | null;
  isLoading: boolean;
  lastUpdated: string | null;
}

const CacheContext = createContext<CacheContextState | undefined>(undefined);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCacheEnabled, setIsCacheEnabled] = useState<boolean>(true);
  const [cacheStats, setCacheStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Initialize state from URL params
  useEffect(() => {
    const noCache = searchParams.get('nocache');
    if (noCache === 'true') {
      setIsCacheEnabled(false);
    }
  }, [searchParams]);

  // Load cache statistics
  const loadCacheStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const stats = await CacheService.getCacheStats();
      setCacheStats(stats);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error("Error loading cache stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle cache state
  const toggleCache = useCallback(() => {
    const newState = !isCacheEnabled;
    setIsCacheEnabled(newState);
    
    // Update URL parameters
    if (newState) {
      searchParams.delete('nocache');
    } else {
      searchParams.set('nocache', 'true');
    }
    setSearchParams(searchParams);
  }, [isCacheEnabled, searchParams, setSearchParams]);

  // Force refresh of cache
  const forceCacheRefresh = useCallback(() => {
    searchParams.set('refresh', Date.now().toString());
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Load cache stats on initial load and set up refresh interval
  useEffect(() => {
    loadCacheStats();
    
    // Reload stats every 5 minutes
    const interval = setInterval(() => {
      loadCacheStats();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadCacheStats]);

  return (
    <CacheContext.Provider
      value={{
        isCacheEnabled,
        toggleCache,
        forceCacheRefresh,
        cacheStats,
        isLoading,
        lastUpdated
      }}
    >
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};
