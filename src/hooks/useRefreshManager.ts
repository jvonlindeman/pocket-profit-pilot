
import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCircuitBreaker } from '@/utils/circuitBreaker';

/**
 * Hook to manage refresh operations with circuit breaker protection
 */
export function useRefreshManager() {
  // Reference to track if a refresh is in progress at the component level
  const isRefreshingRef = useRef<boolean>(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Get singleton circuit breaker instance
  const circuitBreaker = getCircuitBreaker();
  
  /**
   * Check if a refresh operation can proceed
   */
  const canRefresh = useCallback((forceRefresh = false): { allowed: boolean; reason?: string } => {
    // First check local component state
    if (isRefreshingRef.current) {
      return { allowed: false, reason: 'Refresh already in progress in this component' };
    }
    
    // Then check global circuit breaker
    return circuitBreaker.canRefresh(forceRefresh);
  }, []);
  
  /**
   * Start a refresh operation
   */
  const startRefresh = useCallback((forceRefresh = false): boolean => {
    const check = canRefresh(forceRefresh);
    if (!check.allowed) {
      if (!forceRefresh) {
        console.log(`⚠️ Refresh prevented: ${check.reason}`);
        toast({
          title: "Actualización no permitida",
          description: check.reason,
          variant: "destructive"
        });
      }
      return false;
    }
    
    isRefreshingRef.current = true;
    circuitBreaker.startRefresh(forceRefresh);
    return true;
  }, [canRefresh, toast]);
  
  /**
   * End a refresh operation
   */
  const endRefresh = useCallback((error: Error | null = null): void => {
    isRefreshingRef.current = false;
    circuitBreaker.endRefresh(error);
    
    if (error) {
      setLastError(error);
    }
  }, []);
  
  /**
   * Reset the circuit breaker and local refresh state
   */
  const resetCircuitBreaker = useCallback((): void => {
    console.log('🔄 Resetting circuit breaker');
    isRefreshingRef.current = false;
    setLastError(null);
    circuitBreaker.reset();
    
    toast({
      title: "Estado de datos restablecido",
      description: "Todos los indicadores de actualización se han restablecido",
    });
  }, [toast]);
  
  /**
   * Wrapper for refresh operations that handles circuit breaker
   */
  const withRefreshProtection = useCallback(async <T,>(
    operation: () => Promise<T>,
    forceRefresh = false
  ): Promise<T | null> => {
    // For forced refresh operations, we still check if we're already refreshing locally
    if (isRefreshingRef.current && !forceRefresh) {
      console.log('⚠️ Operation skipped, refresh already in progress in this component');
      return null;
    }
    
    if (forceRefresh) {
      // For forced operations, we bypass the circuit breaker and reset local state
      isRefreshingRef.current = false;
      
      try {
        isRefreshingRef.current = true;
        circuitBreaker.startRefresh(true);
        const result = await operation();
        circuitBreaker.endRefresh();
        isRefreshingRef.current = false;
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        circuitBreaker.endRefresh(error);
        isRefreshingRef.current = false;
        setLastError(error);
        throw error;
      }
    } else {
      // For normal operations, we use the circuit breaker normally
      if (!startRefresh(forceRefresh)) {
        // If we couldn't start the refresh, we queue the operation
        try {
          console.log('🔄 Queuing operation in circuit breaker');
          return await circuitBreaker.queueOperation(operation) as T;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setLastError(error);
          throw error;
        }
      }
      
      try {
        return await operation();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setLastError(error);
        throw error;
      } finally {
        endRefresh();
      }
    }
  }, [startRefresh, endRefresh]);
  
  /**
   * Emergency recovery method - forces a reset of all flags
   */
  const emergencyRecovery = useCallback(() => {
    console.log('🚨 EMERGENCY RECOVERY - Forcing reset of all refresh flags');
    isRefreshingRef.current = false;
    setLastError(null);
    circuitBreaker.reset();
    
    toast({
      title: "Recuperación de emergencia completada",
      description: "Se han restablecido todos los estados. Intente actualizar los datos nuevamente.",
    });
    
    return true;
  }, [toast]);
  
  return {
    canRefresh,
    startRefresh,
    endRefresh,
    resetCircuitBreaker,
    withRefreshProtection,
    emergencyRecovery,
    isRefreshing: isRefreshingRef.current || circuitBreaker.getState().isRefreshing,
    refreshCount: circuitBreaker.getState().refreshCount,
    lastError,
    hasErrors: circuitBreaker.getState().consecutiveErrorCount > 0,
    errorCount: circuitBreaker.getState().consecutiveErrorCount
  };
}
