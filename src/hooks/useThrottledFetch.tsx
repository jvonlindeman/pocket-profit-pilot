
import { useRef, useCallback } from 'react';

/**
 * Hook to handle throttled fetch operations
 */
export const useThrottledFetch = (throttleTime: number = 1000) => {
  const lastFetchTimeRef = useRef<number>(0);
  const pendingFetchRef = useRef<any>(null);

  const executeThrottledFetch = useCallback(async <T>(
    fetchFunction: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (timeSinceLastFetch < throttleTime && !forceRefresh) {
      console.log(`Throttling fetch request. Time since last fetch: ${timeSinceLastFetch}ms`);
      
      // Clear any existing pending fetch
      if (pendingFetchRef.current) {
        clearTimeout(pendingFetchRef.current);
      }
      
      // Schedule a delayed fetch
      return new Promise<T>((resolve) => {
        pendingFetchRef.current = setTimeout(async () => {
          console.log("Executing throttled fetch request");
          lastFetchTimeRef.current = Date.now();
          const result = await fetchFunction();
          resolve(result);
        }, throttleTime - timeSinceLastFetch);
      });
    }
    
    // Execute the fetch immediately
    lastFetchTimeRef.current = now;
    return fetchFunction();
  }, [throttleTime]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pendingFetchRef.current) {
      clearTimeout(pendingFetchRef.current);
    }
  }, []);

  return { executeThrottledFetch, cleanup };
};
