
import { useState, useRef, useCallback } from 'react';

/**
 * Hook to manage errors for financial data without circuit breaker
 */
export const useFinanceErrorHandler = () => {
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Create a local ref to track if a refresh is in progress
  const localRefreshingRef = useRef<boolean>(false);

  // Reset error state
  const resetErrorState = useCallback(() => {
    localRefreshingRef.current = false;
    setError(null);
    console.log('🔄 Error state reset in data fetcher');
  }, []);

  return {
    error,
    setError,
    resetErrorState,
    localRefreshingRef
  };
};
