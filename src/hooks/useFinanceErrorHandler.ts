
import { useState, useRef, useCallback } from 'react';
import { getCircuitBreaker } from '@/utils/circuitBreaker';

/**
 * Hook to manage errors and circuit breaker state for financial data
 */
export const useFinanceErrorHandler = () => {
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Create a local ref to track if a refresh is in progress
  const localRefreshingRef = useRef<boolean>(false);
  
  // Get circuit breaker instance
  const circuitBreaker = getCircuitBreaker();

  // Reset circuit breaker state
  const resetCircuitBreakerState = useCallback(() => {
    localRefreshingRef.current = false;
    circuitBreaker.reset();
    setError(null);
    console.log('🔄 Circuit breaker state reset in data fetcher');
  }, []);

  return {
    error,
    setError,
    resetCircuitBreakerState,
    localRefreshingRef
  };
};
