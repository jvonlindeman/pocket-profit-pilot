
import { useState, useCallback } from 'react';

export const useCacheManagement = () => {
  const [cacheStatus, setCacheStatus] = useState<{
    lastRefresh: Date | null;
    refreshAttempts: number;
  }>({
    lastRefresh: null,
    refreshAttempts: 0
  });

  /**
   * Update the refresh status information
   */
  const updateCacheStatus = useCallback(() => {
    const now = new Date();
    setCacheStatus(prevStatus => ({
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
