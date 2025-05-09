
import { useCallback, useRef } from 'react';
import { DateRange } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';
import { getCircuitBreaker } from '@/utils/circuitBreaker';

/**
 * Hook to manage refresh operations with circuit breaker protection
 */
export function useRefreshManager() {
  // Reference to track if a refresh is in progress at the component level
  const isRefreshingRef = useRef<boolean>(false);
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
  const endRefresh = useCallback((): void => {
    isRefreshingRef.current = false;
    circuitBreaker.endRefresh();
  }, []);
  
  /**
   * Reset the circuit breaker and local refresh state
   */
  const resetCircuitBreaker = useCallback((): void => {
    console.log('🔄 Resetting circuit breaker');
    isRefreshingRef.current = false;
    circuitBreaker.reset();
  }, []);
  
  /**
   * Wrapper for refresh operations that handles circuit breaker
   */
  const withRefreshProtection = useCallback(async <T,>(
    operation: () => Promise<T>,
    forceRefresh = false
  ): Promise<T | null> => {
    if (!startRefresh(forceRefresh)) {
      return null;
    }
    
    try {
      return await operation();
    } finally {
      endRefresh();
    }
  }, [startRefresh, endRefresh]);
  
  return {
    canRefresh,
    startRefresh,
    endRefresh,
    resetCircuitBreaker,
    withRefreshProtection,
    isRefreshing: isRefreshingRef.current || circuitBreaker.getState().isRefreshing,
    refreshCount: circuitBreaker.getState().refreshCount
  };
}
