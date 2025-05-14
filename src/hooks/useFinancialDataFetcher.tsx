import { useState, useCallback } from 'react';
import ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { formatDateYYYYMMDD, logDateInfo } from '@/utils/dateUtils';
import CacheService from '@/services/cache';
import { toast } from '@/components/ui/use-toast';

export const useFinancialDataFetcher = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
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

  // Check API connectivity
  const checkApiConnectivity = useCallback(async () => {
    const zohoConnected = await ZohoService.checkApiConnectivity();
    // Add the checkApiConnectivity method to StripeService if it doesn't exist
    const stripeConnected = StripeService.checkApiConnectivity ? 
      await StripeService.checkApiConnectivity() : 
      true;
    
    setApiConnectivity({
      zoho: zohoConnected,
      stripe: stripeConnected
    });
    
    return { zoho: zohoConnected, stripe: stripeConnected };
  }, []);

  // Verify cache integrity for a range
  const verifyCacheIntegrity = useCallback(async (dateRange: { startDate: Date; endDate: Date }) => {
    try {
      // Verify Zoho cache
      const zohoCache = await CacheService.checkCache(
        'Zoho', 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      if (zohoCache.cached && zohoCache.status === 'complete') {
        // Verify there are actually transactions
        const { isConsistent, transactionCount } = await CacheService.verifyCacheIntegrity(
          'Zoho',
          dateRange.startDate,
          dateRange.endDate
        );
        
        if (!isConsistent && transactionCount < 10) {
          console.log("Cache integrity issue detected. Attempting repair...");
          
          // Try to repair the cache
          const repaired = await ZohoService.repairCache(dateRange.startDate, dateRange.endDate);
          if (repaired) {
            console.log("Cache successfully repaired");
          } else {
            console.warn("Cache repair failed or wasn't needed");
          }
        }
      }
      
      // Verify Stripe cache (similar approach)
      const stripeCache = await CacheService.checkCache(
        'Stripe', 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      if (stripeCache.cached && stripeCache.status === 'complete') {
        const { isConsistent, transactionCount } = await CacheService.verifyCacheIntegrity(
          'Stripe',
          dateRange.startDate,
          dateRange.endDate
        );
        
        if (!isConsistent && transactionCount < 5) {
          console.log("Stripe cache integrity issue detected. Will force refresh during next data fetch.");
        }
      }
    } catch (err) {
      console.error("Error verifying cache integrity:", err);
    }
  }, []);

  // Fetch financial data from external services
  const fetchFinancialData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: {
      onTransactions: (transactions: any[]) => void,
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void,
    }
  ) => {
    // If we've fetched recently and not forcing a refresh, don't fetch again
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTimestamp < 2000) {
      console.log("Skipping fetch, too soon since last fetch");
      return false;
    }
    
    setLastFetchTimestamp(now);
    console.log("Fetching financial data...");
    setLoading(true);
    setError(null);
    setUsingCachedData(false);
    
    // Reset cache status
    setCacheStatus({
      zoho: { hit: false, partial: false },
      stripe: { hit: false, partial: false }
    });

    try {
      // Check API connectivity first
      const connectivity = await checkApiConnectivity();
      
      if (!connectivity.zoho && !connectivity.stripe) {
        toast({
          title: "API Connectivity Issue",
          description: "Cannot connect to Zoho or Stripe APIs. Using cached data if available.",
          variant: "destructive"
        });
      } else if (!connectivity.zoho) {
        toast({
          title: "Zoho API Connectivity Issue",
          description: "Cannot connect to Zoho API. Using cached data if available.",
          variant: "destructive"
        });
      } else if (!connectivity.stripe) {
        toast({
          title: "Stripe API Connectivity Issue",
          description: "Cannot connect to Stripe API. Using cached data if available.",
          variant: "destructive"
        });
      }
      
      // Verify cache integrity
      await verifyCacheIntegrity(dateRange);

      // Log exact date objects for debugging
      logDateInfo("Original dateRange from datepicker", dateRange);
      
      // Check Zoho cache first if not forcing refresh
      let zohoFromCache = false;
      if (!forceRefresh) {
        const zohoCache = await CacheService.checkCache(
          'Zoho', 
          dateRange.startDate, 
          dateRange.endDate
        );
        
        if (zohoCache.cached && zohoCache.data) {
          zohoFromCache = true;
          setCacheStatus(prev => ({
            ...prev,
            zoho: { hit: true, partial: false }
          }));
          console.log("Using cached Zoho data with", zohoCache.data.length, "transactions");
        } else if (zohoCache.partial) {
          setCacheStatus(prev => ({
            ...prev,
            zoho: { hit: false, partial: true }
          }));
          console.log("Partial Zoho cache hit, need to fetch more data");
        } else {
          console.log("No cached Zoho data available");
        }
      }
      
      // Get transactions from Zoho Books - either from cache or API
      const zohoData = await ZohoService.getTransactions(
        dateRange.startDate, 
        dateRange.endDate,
        forceRefresh
      );

      // Detect if we're using cached data based on the response
      const rawResponseData = ZohoService.getLastRawResponse();
      if (rawResponseData && (rawResponseData.cached || zohoFromCache)) {
        console.log("Using cached data from previous response");
        setUsingCachedData(true);
      }

      // Get the current raw response for debugging immediately after
      const rawData = ZohoService.getLastRawResponse();
      setRawResponse(rawData);
      console.log("Fetched raw response for debugging:", rawData);

      // Process collaborator data
      callbacks.onCollaboratorData(rawData);

      // Check Stripe cache if not forcing refresh
      let stripeFromCache = false;
      if (!forceRefresh) {
        const stripeCache = await CacheService.checkCache(
          'Stripe', 
          dateRange.startDate, 
          dateRange.endDate
        );
        
        if (stripeCache.cached && stripeCache.data) {
          stripeFromCache = true;
          setCacheStatus(prev => ({
            ...prev,
            stripe: { hit: true, partial: false }
          }));
          console.log("Using cached Stripe data with", stripeCache.data.length, "transactions");
        } else if (stripeCache.partial) {
          setCacheStatus(prev => ({
            ...prev,
            stripe: { hit: false, partial: true }
          }));
          console.log("Partial Stripe cache hit, need to fetch more data");
        } else {
          console.log("No cached Stripe data available");
        }
      }

      // Get transactions from Stripe
      console.log("Fetching from Stripe:", dateRange.startDate, dateRange.endDate);
      const stripeData = await StripeService.getTransactions(
        dateRange.startDate,
        dateRange.endDate,
        forceRefresh
      );
      
      // If both data sources are from cache, mark as using cached data
      if (zohoFromCache && stripeFromCache) {
        setUsingCachedData(true);
      }

      // Combine the data
      const combinedData = [...zohoData, ...stripeData.transactions];
      console.log("Combined transactions:", combinedData.length);
      console.log("Stripe data summary:", {
        gross: stripeData.gross,
        fees: stripeData.fees,
        transactionFees: stripeData.transactionFees,
        payoutFees: stripeData.payoutFees,
        net: stripeData.net,
        feePercentage: stripeData.feePercentage
      });
      
      // Process separated income
      callbacks.onIncomeTypes(combinedData, stripeData);
      
      // Update transactions state
      callbacks.onTransactions(combinedData);
      
      // Schedule cache check for background refresh if needed
      if (!forceRefresh) {
        ZohoService.checkAndRefreshCache(dateRange.startDate, dateRange.endDate);
      }
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(err.message || "Error al cargar los datos financieros");
      
      // Make sure to get any raw response for debugging even in case of error
      const rawData = ZohoService.getLastRawResponse();
      if (rawData) {
        setRawResponse(rawData);
        console.log("Set raw response after error:", rawData);
      }
      
      setLoading(false);
      return false;
    }
  }, [lastFetchTimestamp, checkApiConnectivity, verifyCacheIntegrity]);

  return {
    loading,
    error,
    rawResponse,
    usingCachedData,
    fetchFinancialData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity
  };
};
