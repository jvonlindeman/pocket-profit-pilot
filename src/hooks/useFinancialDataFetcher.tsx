import { useState, useCallback, useEffect, useRef } from 'react';
import { financialService } from '@/services/financialService';
import { apiRequestManager } from '@/utils/ApiRequestManager';

/**
 * Base hook for fetching financial data with improved deduplication
 * Simplified to not use persistent cache - React Query handles caching
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
  const connectivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check cache status - simplified stub that returns defaults
  const checkCacheStatus = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    skipIfInProgress = true
  ) => {
    if (!dateRange.startDate || !dateRange.endDate) return null;

    // Since we no longer use persistent cache, just return defaults
    const result = {
      zoho: { cached: false, partial: false },
      stripe: { cached: false, partial: false }
    };

    setCacheStatus({
      zoho: { hit: false, partial: false },
      stripe: { hit: false, partial: false }
    });
    
    setUsingCachedData(false);
    
    return result;
  }, []);

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
      45000, // 45 second TTL
      3000   // 3 second cooldown
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
          
          return result;
        },
        30000, // 30 second TTL
        8000   // 8 second cooldown for fetches
      );
      
      setLoading(false);
      return success;
    } catch (err: any) {
      console.error("Error in fetchFinancialData:", err);
      
      // If it's a cooldown error, don't set as critical error
      if (err.message?.includes('Request too frequent')) {
        console.warn("Request throttled, skipping this call");
        return false;
      }
      
      setError(err.message || "Error al cargar los datos financieros");
      setLoading(false);
      return false;
    }
  }, [checkApiConnectivity]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (connectivityTimeoutRef.current) {
        clearTimeout(connectivityTimeoutRef.current);
      }
    };
  }, []);

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
