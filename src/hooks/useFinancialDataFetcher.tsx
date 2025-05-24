
import { useState, useCallback, useEffect, useRef } from 'react';
import { financialService } from '@/services/financialService';
import { zohoRepository } from '@/repositories/zohoRepository';
import { useCacheSegments } from '@/hooks/cache/useCacheSegments';
import CacheService from '@/services/cache';
import { apiRequestManager } from '@/utils/ApiRequestManager';

/**
 * Base hook for fetching financial data with improved deduplication
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
  const currentRequestIdRef = useRef<string>('');
  const cacheCheckInProgressRef = useRef<boolean>(false);
  const connectivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get cache segments helper
  const { checkSourceCache } = useCacheSegments();

  // Check cache status with improved deduplication
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

      // Use ApiRequestManager to deduplicate cache check calls with shorter TTL
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
        15000, // 15 second TTL (reduced from 10s)
        3000   // 3 second cooldown (reduced from 5s)
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

  // Check API connectivity with improved caching
  const checkApiConnectivity = useCallback(async () => {
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
      45000, // 45 second TTL (reduced from 60s)
      3000   // 3 second cooldown (reduced from 5s)
    );
  }, []);

  // Fetch financial data with improved duplicate prevention
  const fetchFinancialData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: {
      onTransactions: (transactions: any[]) => void,
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void,
    }
  ) => {
    // Generate a unique request ID based on parameters
    const requestKey = `fetch-data-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}-${forceRefresh}`;
    
    console.log(`[FINANCIAL_DATA_FETCHER] Starting fetch with key: ${requestKey}`);
    
    try {
      // Use ApiRequestManager to prevent duplicate requests
      const success = await apiRequestManager.executeRequest(
        requestKey,
        async () => {
          console.log(`[FINANCIAL_DATA_FETCHER] Executing fetch for ${requestKey}`);
          
          setLoading(true);
          setError(null);
          
          // Check connectivity first (cached)
          await checkApiConnectivity();
          
          // Check cache status first - but only once
          if (!cacheCheckInProgressRef.current) {
            await checkCacheStatus(dateRange, false);
          }
          
          // Fetch the financial data
          const result = await financialService.fetchFinancialData(
            dateRange, 
            forceRefresh, 
            callbacks
          );
          
          // Get raw response for debugging
          const rawData = financialService.getLastRawResponse();
          if (rawData) {
            setRawResponse(rawData);
          }
          
          // Check cache status again after fetch to update the UI
          await checkCacheStatus(dateRange);
          
          return result;
        },
        30000, // 30 second TTL
        8000   // 8 second cooldown for fetches
      );
      
      setLoading(false);
      return success;
    } catch (err: any) {
      console.error("Error in fetchFinancialData:", err);
      
      // Si es un error de cooldown, no establecer como error crítico
      if (err.message?.includes('Request too frequent')) {
        console.warn("Request throttled, skipping this call");
        return false;
      }
      
      setError(err.message || "Error al cargar los datos financieros");
      setLoading(false);
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
