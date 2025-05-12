
import { useState, useCallback } from 'react';
import { CacheStats } from '@/types/cache';

export const useCacheManagement = () => {
  const [cacheStatus, setCacheStatus] = useState<{
    lastRefresh: Date | null;
    refreshAttempts: number;
    usingCachedData: boolean;
    partialRefresh: boolean;
    stats: CacheStats | null;
  }>({
    lastRefresh: null,
    refreshAttempts: 0,
    usingCachedData: false,
    partialRefresh: false,
    stats: null
  });

  /**
   * Update the refresh status information
   */
  const updateCacheStatus = useCallback(() => {
    const now = new Date();
    setCacheStatus(prevStatus => ({
      ...prevStatus,
      lastRefresh: now,
      refreshAttempts: (prevStatus.refreshAttempts || 0) + 1,
    }));
    
    console.log("🔄 Refresh status updated:", {
      time: now.toISOString(),
      attempts: cacheStatus.refreshAttempts + 1
    });
  }, [cacheStatus.refreshAttempts]);

  return {
    cacheStatus,
    updateCacheStatus
  };
};
