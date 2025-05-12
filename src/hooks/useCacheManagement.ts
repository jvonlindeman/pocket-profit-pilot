
import { useState, useCallback } from 'react';

export const useCacheManagement = () => {
  const [refreshStatus, setRefreshStatus] = useState<{
    lastRefresh: Date | null;
    refreshAttempts: number;
  }>({
    lastRefresh: null,
    refreshAttempts: 0
  });

  /**
   * Update the refresh status information
   */
  const updateRefreshStatus = useCallback(() => {
    const now = new Date();
    setRefreshStatus(prevStatus => ({
      lastRefresh: now,
      refreshAttempts: (prevStatus.refreshAttempts || 0) + 1,
    }));
    
    console.log("🔄 Refresh status updated:", {
      time: now.toISOString(),
      attempts: refreshStatus.refreshAttempts + 1
    });
  }, [refreshStatus.refreshAttempts]);

  return {
    refreshStatus,
    updateRefreshStatus
  };
};
