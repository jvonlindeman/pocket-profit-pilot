
import { useState, useCallback, useEffect, useRef } from 'react';
import { financialService } from '@/services/financialService';
import { zohoRepository } from '@/repositories/zohoRepository';
import { useCacheSegments } from '@/hooks/cache/useCacheSegments';
import CacheService from '@/services/cache';
import { apiRequestManager } from '@/utils/ApiRequestManager';

/**
 * Base hook for fetching financial data
 */
export const useFinancialDataFetcher = () => {
  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [cacheStatus, setCacheStatus] = useState<{
    zoho: { hit: boolean, partial: boolean },
    stripe: { hit: boolean, partial: boolean }
  }>({
    zoho: { hit: false, partial: false },
    stripe: { hit: false, partial: false }
  });
  const [apiConnectivity, setApiConnectivity] = useState<{
    zoho: boolean,
    stripe: boolean
  }>({
    zoho: true,
    stripe: true
  });
  
  // References to prevent duplicate calls
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchParamsRef = useRef<{
    startDate?: Date;
    endDate?: Date;
    forceRefresh?: boolean;
    requestId?: string;
  }>({});
  const connectivityTimeoutRef = useRef<any>(null);
  const currentRequestIdRef = useRef<string>('');
  const cacheCheckInProgressRef = useRef<boolean>(false);

  // Get cache segments helper
  const { checkSourceCache } = useCacheSegments();

  // Check cache status - optimized to prevent duplicate calls
  const checkCacheStatus = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    skipIfInProgress = true
  ) => {
    if (!dateRange.startDate || !dateRange.endDate) return null;

    // Skip if another check is in progress
    if (skipIfInProgress && cacheCheckInProgressRef.current) {
      console.log("Cache check already in progress, skipping duplicate check");
      return null;
    }

    // Generate a cache key for the cache check itself
    const cacheCheckKey = `cache-status-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`;
    
    try {
      cacheCheckInProgressRef.current = true;

      // Use ApiRequestManager to deduplicate cache check calls
      const result = await apiRequestManager.executeRequest(
        cacheCheckKey,
        async () => {
          // Check Zoho cache
          const zohoCache = await checkSourceCache('Zoho', dateRange);
          
          // Check Stripe cache
          const stripeCache = await checkSourceCache('Stripe', dateRange);
          
          return {
            zoho: zohoCache,
            stripe: stripeCache
          };
        },
        10000, // 10 second TTL
        5000   // 5 second cooldown
      );

      // Update states using the result
      setCacheStatus({
        zoho: { 
          hit: result.zoho.cached, 
          partial: result.zoho.partial || false 
        },
        stripe: { 
          hit: result.stripe.cached, 
          partial: result.stripe.partial || false 
        }
      });
      
      // Determine if we're using cached data
      setUsingCachedData(result.zoho.cached || result.stripe.cached);
      
      return result;
    } catch (err) {
      console.error("Error checking cache status:", err);
      return null;
    } finally {
      cacheCheckInProgressRef.current = false;
    }
  }, [checkSourceCache]);

  // Check API connectivity with caching
  const checkApiConnectivity = useCallback(async () => {
    // Clear any pending timeout
    if (connectivityTimeoutRef.current) {
      clearTimeout(connectivityTimeoutRef.current);
    }
    
    // Use the ApiRequestManager to deduplicate connectivity checks
    return apiRequestManager.executeRequest(
      'api-connectivity-check',
      async () => {
        try {
          const result = await financialService.checkApiConnectivity();
          setApiConnectivity(result);
          return result;
        } catch (error) {
          console.error("Error checking API connectivity:", error);
          const result = { zoho: false, stripe: false };
          setApiConnectivity(result);
          return result;
        }
      },
      60000, // 60 second TTL
      5000   // 5 second cooldown
    );
  }, []);

  // Fetch financial data from external services with duplication prevention
  const fetchFinancialData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: {
      onTransactions: (transactions: any[]) => void,
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void,
    }
  ) => {
    // Generate a unique request ID
    const requestId = `fetch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    currentRequestIdRef.current = requestId;
    
    // Check if we're already fetching data
    if (isFetchingRef.current) {
      console.warn(`Fetch in progress, skipping duplicate request (${requestId})`);
      return false;
    }
    
    // Check if this is an identical request to the last one made
    const lastParams = lastFetchParamsRef.current;
    const sameStartDate = lastParams.startDate && lastParams.startDate.getTime() === dateRange.startDate.getTime();
    const sameEndDate = lastParams.endDate && lastParams.endDate.getTime() === dateRange.endDate.getTime();
    const sameForce = lastParams.forceRefresh === forceRefresh;
    const shortTimeElapsed = lastParams.requestId && 
                            (Date.now() - parseInt(lastParams.requestId.split('-')[1])) < 5000;
    
    if (sameStartDate && sameEndDate && sameForce && shortTimeElapsed && !forceRefresh) {
      console.warn(`Duplicate request detected within short timeframe, using cached data (${requestId})`);
      return false;
    }
    
    // Update last fetch params and set fetching flag
    lastFetchParamsRef.current = { 
      startDate: dateRange.startDate, 
      endDate: dateRange.endDate, 
      forceRefresh, 
      requestId 
    };
    isFetchingRef.current = true;
    
    setLoading(true);
    setError(null);
    
    // Check cache status first - but only once
    if (!cacheCheckInProgressRef.current) {
      await checkCacheStatus(dateRange, false);
    }
    
    try {
      // Check connectivity first (cached)
      await checkApiConnectivity();
      
      // Fetch the financial data
      const success = await financialService.fetchFinancialData(
        dateRange, 
        forceRefresh, 
        callbacks
      );
      
      // Get raw response for debugging
      const rawData = financialService.getLastRawResponse();
      if (rawData) {
        setRawResponse(rawData);
      }
      
      // Check cache status again after fetch to update the UI - but only if this is still the current request
      if (currentRequestIdRef.current === requestId) {
        await checkCacheStatus(dateRange);
      }
      
      setLoading(false);
      isFetchingRef.current = false;
      return success;
    } catch (err: any) {
      console.error("Error in fetchFinancialData:", err);
      setError(err.message || "Error al cargar los datos financieros");
      setLoading(false);
      isFetchingRef.current = false;
      return false;
    }
  }, [checkApiConnectivity, checkCacheStatus]);

  // Check cache status on mount
  useEffect(() => {
    // This will run once on mount
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    checkCacheStatus({ startDate, endDate });
    
    // Clean up timeout on unmount
    return () => {
      if (connectivityTimeoutRef.current) {
        clearTimeout(connectivityTimeoutRef.current);
      }
    };
  }, [checkCacheStatus]);

  return {
    loading,
    error,
    rawResponse,
    usingCachedData,
    fetchFinancialData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity,
    checkCacheStatus
  };
};
