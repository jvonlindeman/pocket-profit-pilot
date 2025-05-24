
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/types/financial';
import { dataFetcherService } from '@/services/dataFetcherService';

/**
 * Unified hook for financial data management with centralized approach
 */
export const useUnifiedFinancialData = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
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
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshCooldownRef = useRef<number>(10000); // 10 second cooldown
  const currentRequestIdRef = useRef<string>('');
  
  // Function to check API connectivity
  const checkApiConnectivity = useCallback(async () => {
    try {
      const result = await dataFetcherService.checkApiConnectivity();
      setApiConnectivity(result);
      return result;
    } catch (error) {
      console.error("Error checking API connectivity:", error);
      const result = { zoho: false, stripe: false };
      setApiConnectivity(result);
      return result;
    }
  }, []);

  // Function to check cache status
  const checkCacheStatus = useCallback(async (dateRange: { startDate: Date; endDate: Date }) => {
    try {
      const result = await dataFetcherService.checkCacheStatus(dateRange);
      
      setCacheStatus({
        zoho: { hit: result.zoho.cached, partial: result.zoho.partial },
        stripe: { hit: result.stripe.cached, partial: result.stripe.partial }
      });
      
      setUsingCachedData(result.zoho.cached || result.stripe.cached);
      
      return result;
    } catch (error) {
      console.error("Error checking cache status:", error);
      return null;
    }
  }, []);

  // Function to fetch data
  const fetchData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false,
    callbacks: {
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void
    }
  ) => {
    // Prevent duplicate fetches if already in progress
    if (isFetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return false;
    }
    
    // Apply cooldown if not forcing a refresh
    const now = Date.now();
    if (!forceRefresh && now - lastRefreshTimeRef.current < refreshCooldownRef.current) {
      console.log("Refresh cooldown in effect, skipping fetch");
      return false;
    }
    
    // Update state and refs
    isFetchingRef.current = true;
    lastRefreshTimeRef.current = now;
    setLoading(true);
    setError(null);
    
    try {
      // Check API connectivity first
      await checkApiConnectivity();
      
      // Check cache status before fetch
      await checkCacheStatus(dateRange);
      
      // Fetch data using the centralized service
      const success = await dataFetcherService.fetchAllFinancialData(
        dateRange,
        forceRefresh,
        {
          onTransactions: (data) => {
            setTransactions(data);
            setDataInitialized(true);
          },
          ...callbacks
        }
      );
      
      // Update raw response for debugging
      const responseData = dataFetcherService.getLastRawResponse();
      if (responseData) {
        setRawResponse(responseData);
      }
      
      // Check cache status again after fetch
      await checkCacheStatus(dateRange);
      
      return success;
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(err.message || "Error al cargar los datos financieros");
      return false;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [checkApiConnectivity, checkCacheStatus]);
  
  // Function to refresh data with throttling
  const refreshData = useCallback((force = false) => {
    if (force) {
      // Reset throttling for forced refreshes
      lastRefreshTimeRef.current = 0;
    }
    
    return fetchData;
  }, [fetchData]);
  
  // Check connectivity on mount
  useEffect(() => {
    checkApiConnectivity();
  }, [checkApiConnectivity]);

  return {
    transactions,
    dataInitialized,
    loading,
    error,
    rawResponse,
    usingCachedData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity,
    fetchData,
    refreshData,
    checkCacheStatus,
  };
};
