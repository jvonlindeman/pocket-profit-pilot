
import { useCallback } from 'react';
import { useRefreshStatus } from '@/hooks/useRefreshStatus';
import { useToast } from '@/hooks/use-toast';

/**
 * Simplified hook to manage data refresh operations without circuit breaker
 */
export const useSimpleDataRefresh = () => {
  const { toast } = useToast();
  
  // Use our simplified refresh status manager
  const refreshStatus = useRefreshStatus();
  const { 
    isRefreshing, 
    startRefresh, 
    endRefresh, 
    resetRefreshState, 
    emergencyRecovery,
    lastError,
    hasErrors,
    errorCount
  } = refreshStatus;

  // Wrapper for refresh operations that manages state
  const withRefreshProtection = useCallback(async <T,>(
    operation: () => Promise<T>,
    forceRefresh = false
  ): Promise<T | null> => {
    // For forced refresh operations, we bypass the check
    if (!forceRefresh && isRefreshing) {
      console.log('⚠️ Operation skipped, refresh already in progress');
      return null;
    }
    
    // Always start the refresh (will return false if already refreshing)
    if (!startRefresh()) {
      return null;
    }
    
    try {
      const result = await operation();
      endRefresh(null); // Success, no error
      return result;
    } catch (err) {
      console.error('❌ Error in operation:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      endRefresh(error);
      throw error;
    }
  }, [isRefreshing, startRefresh, endRefresh]);

  // Manual refresh function that forces refresh
  const forceManualRefresh = useCallback(async (refreshFn: (forceRefresh: boolean) => Promise<boolean>) => {
    console.log('🔄 Manual refresh requested...');
    resetRefreshState();
    return await refreshFn(true);
  }, [resetRefreshState]);

  // Clear cache and refresh data
  const handleClearCacheAndRefresh = useCallback(async (
    clearCacheFn: (dateRange: any) => Promise<boolean>,
    refreshFn: (forceRefresh: boolean) => Promise<boolean>,
    dateRange: any
  ) => {
    return await withRefreshProtection(async () => {
      console.log('🗑️ Clearing cache and refreshing data...');
      toast({
        title: "Limpiando caché",
        description: "Eliminando datos en caché y obteniendo datos frescos...",
      });
      
      try {
        const success = await clearCacheFn(dateRange);
        if (success) {
          console.log('✅ Cache cleared successfully');
          // Force refresh the data after clearing cache
          return await refreshFn(true);
        } else {
          console.error('❌ Failed to clear cache');
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo limpiar el caché",
          });
          return false;
        }
      } catch (err) {
        console.error('🚨 Error clearing cache:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Error desconocido al limpiar caché",
        });
        return false;
      }
    }, true);
  }, [withRefreshProtection, toast]);

  // Handle emergency recovery - reset all states
  const handleEmergencyRecovery = useCallback((resetDataFetcherState: () => void) => {
    // Reset both refresh status and data fetcher states
    emergencyRecovery();
    if (resetDataFetcherState) {
      resetDataFetcherState();
    }
    return true;
  }, [emergencyRecovery]);

  return {
    isRefreshing,
    resetRefreshState,
    withRefreshProtection,
    forceManualRefresh,
    handleClearCacheAndRefresh,
    handleEmergencyRecovery,
    lastError,
    hasErrors,
    errorCount
  };
};
