
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import CacheService from '@/services/cache';

interface CacheContextState {
  isCacheEnabled: boolean;
  toggleCache: () => void;
  forceCacheRefresh: () => void;
  cacheStats: any | null;
  isLoading: boolean;
}

const CacheContext = createContext<CacheContextState | undefined>(undefined);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCacheEnabled, setIsCacheEnabled] = useState<boolean>(true);
  const [cacheStats, setCacheStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize state from URL params
  useEffect(() => {
    const noCache = searchParams.get('nocache');
    if (noCache === 'true') {
      setIsCacheEnabled(false);
    }
  }, [searchParams]);

  // Toggle cache state
  const toggleCache = () => {
    const newState = !isCacheEnabled;
    setIsCacheEnabled(newState);
    
    // Update URL parameters
    if (newState) {
      searchParams.delete('nocache');
    } else {
      searchParams.set('nocache', 'true');
    }
    setSearchParams(searchParams);
  };

  // Force refresh of cache
  const forceCacheRefresh = () => {
    searchParams.set('refresh', Date.now().toString());
    setSearchParams(searchParams);
  };

  // Load cache statistics
  const loadCacheStats = async () => {
    try {
      setIsLoading(true);
      const stats = await CacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error("Error loading cache stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cache stats on initial load
  useEffect(() => {
    loadCacheStats();
    
    // Reload stats every 5 minutes
    const interval = setInterval(() => {
      loadCacheStats();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <CacheContext.Provider
      value={{
        isCacheEnabled,
        toggleCache,
        forceCacheRefresh,
        cacheStats,
        isLoading,
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
