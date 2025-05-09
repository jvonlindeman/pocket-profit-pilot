
import { useCallback } from 'react';
import { useRefreshManager } from '@/hooks/useRefreshManager';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage data refresh operations
 */
export const useDataRefresh = () => {
  const { toast } = useToast();
  
  // Use our improved refresh manager
  const refreshManager = useRefreshManager();
  const { 
    isRefreshing, 
    refreshCount, 
    withRefreshProtection, 
    resetCircuitBreaker, 
    emergencyRecovery,
    lastError,
    hasErrors,
    errorCount
  } = refreshManager;

  // Manual refresh function that resets circuit breaker and forces refresh
  const forceManualRefresh = useCallback(async (refreshFn: (forceRefresh: boolean) => Promise<boolean>) => {
    console.log('🔄 Manual refresh requested, resetting circuit breaker...');
    resetCircuitBreaker();
    return await refreshFn(true);
  }, [resetCircuitBreaker]);

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
  const handleEmergencyRecovery = useCallback((resetCircuitBreakerState: () => void) => {
    // Reset both refresh manager and data fetcher states
    emergencyRecovery();
    resetCircuitBreakerState();
    
    // Toast is already shown by the emergencyRecovery function
    
    return true;
  }, [emergencyRecovery]);

  return {
    isRefreshing,
    refreshCount,
    withRefreshProtection,
    resetCircuitBreaker,
    forceManualRefresh,
    handleClearCacheAndRefresh,
    handleEmergencyRecovery,
    lastError,
    hasErrors,
    errorCount
  };
};
