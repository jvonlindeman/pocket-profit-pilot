
import { useState, useCallback, useRef } from 'react';
import * as ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { formatDateYYYYMMDD, logDateInfo } from '@/utils/dateUtils';
import CacheService from '@/services/cache';
import { toast } from '@/components/ui/use-toast';
import { CLIENT_CACHE_KEY_PREFIX, CACHE_DURATION } from '@/services/zoho/api/config';

// Type for the memory cache entry
interface MemoryCacheEntry {
  dateRangeKey: string;
  zohoData: any[];
  stripeData: any;
  timestamp: number;
  expiresAt: number;
}

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

  // Memory cache for financial data
  const memoryCache = useRef<MemoryCacheEntry[]>([]);

  // Generate a cache key for a date range
  const generateDateRangeKey = useCallback((startDate: Date, endDate: Date): string => {
    return `${CLIENT_CACHE_KEY_PREFIX}_${formatDateYYYYMMDD(startDate)}_${formatDateYYYYMMDD(endDate)}`;
  }, []);

  // Check if data is in memory cache
  const checkMemoryCache = useCallback((startDate: Date, endDate: Date): {
    found: boolean;
    zohoData?: any[];
    stripeData?: any;
  } => {
    const now = Date.now();
    const dateRangeKey = generateDateRangeKey(startDate, endDate);
    
    // Clean expired entries
    memoryCache.current = memoryCache.current.filter(entry => entry.expiresAt > now);
    
    // Find matching entry
    const cacheEntry = memoryCache.current.find(entry => entry.dateRangeKey === dateRangeKey);
    
    if (cacheEntry) {
      console.log("Found data in memory cache for range:", dateRangeKey);
      return {
        found: true,
        zohoData: cacheEntry.zohoData,
        stripeData: cacheEntry.stripeData
      };
    }
    
    return { found: false };
  }, [generateDateRangeKey]);

  // Store data in memory cache
  const storeInMemoryCache = useCallback((startDate: Date, endDate: Date, zohoData: any[], stripeData: any) => {
    const dateRangeKey = generateDateRangeKey(startDate, endDate);
    const now = Date.now();
    
    // Remove any existing entry with the same key
    memoryCache.current = memoryCache.current.filter(entry => entry.dateRangeKey !== dateRangeKey);
    
    // Add new entry
    memoryCache.current.push({
      dateRangeKey,
      zohoData,
      stripeData,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    });
    
    console.log("Stored data in memory cache for range:", dateRangeKey);
    
    // Limit cache size to 10 entries
    if (memoryCache.current.length > 10) {
      memoryCache.current.sort((a, b) => b.timestamp - a.timestamp);
      memoryCache.current = memoryCache.current.slice(0, 10);
    }
  }, [generateDateRangeKey]);

  // Check API connectivity
  const checkApiConnectivity = useCallback(async () => {
    const zohoConnected = await ZohoService.checkApiConnectivity();
    const stripeConnected = await StripeService.checkApiConnectivity();
    
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
      // Check if we have this data in memory cache first (only if not forcing a refresh)
      let zohoData: any[] = [];
      let stripeData: any = { transactions: [] };
      let dataFromMemoryCache = false;
      
      if (!forceRefresh) {
        const memoryCacheResult = checkMemoryCache(dateRange.startDate, dateRange.endDate);
        
        if (memoryCacheResult.found && memoryCacheResult.zohoData && memoryCacheResult.stripeData) {
          console.log("Using data from memory cache");
          zohoData = memoryCacheResult.zohoData;
          stripeData = memoryCacheResult.stripeData;
          dataFromMemoryCache = true;
          setUsingCachedData(true);
          
          // Update cache status
          setCacheStatus({
            zoho: { hit: true, partial: false },
            stripe: { hit: true, partial: false }
          });
          
          // Process the cached data
          const rawData = ZohoService.getLastRawResponse();
          setRawResponse(rawData);
          
          // Process collaborator data
          callbacks.onCollaboratorData(rawData);
          
          // Combine the data
          const combinedData = [...zohoData, ...stripeData.transactions];
          
          // Process separated income
          callbacks.onIncomeTypes(combinedData, stripeData);
          
          // Update transactions state
          callbacks.onTransactions(combinedData);
          
          setLoading(false);
          return true;
        }
      }
      
      // If not in memory cache, check API connectivity
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
      
      // Verify cache integrity if not using memory cache
      if (!dataFromMemoryCache) {
        await verifyCacheIntegrity(dateRange);
      }

      // Log exact date objects for debugging
      logDateInfo("Original dateRange from datepicker", dateRange);
      
      // Get transactions from Zoho Books - should check server cache internally
      if (!dataFromMemoryCache) {
        zohoData = await ZohoService.getTransactions(
          dateRange.startDate, 
          dateRange.endDate,
          forceRefresh
        );
        
        // Check if we're using cached data based on the response
        const rawResponseData = ZohoService.getLastRawResponse();
        if (rawResponseData && rawResponseData.cached) {
          console.log("Using cached data from previous response");
          setUsingCachedData(true);
          setCacheStatus(prev => ({
            ...prev,
            zoho: { hit: true, partial: false }
          }));
        }
        
        // Get the current raw response for debugging
        const rawData = ZohoService.getLastRawResponse();
        setRawResponse(rawData);
        console.log("Fetched raw response for debugging:", rawData);
        
        // Process collaborator data
        callbacks.onCollaboratorData(rawData);
      }
      
      // Get transactions from Stripe if not already loaded from memory cache
      if (!dataFromMemoryCache) {
        console.log("Fetching from Stripe:", dateRange.startDate, dateRange.endDate);
        stripeData = await StripeService.getTransactions(
          dateRange.startDate,
          dateRange.endDate,
          forceRefresh
        );
        
        // Check if we're using cached Stripe data
        if (stripeData.cached) {
          setCacheStatus(prev => ({
            ...prev,
            stripe: { hit: true, partial: false }
          }));
        }
      }
      
      // Store in memory cache for future use if not already there and not forcing refresh
      if (!dataFromMemoryCache && !forceRefresh) {
        storeInMemoryCache(dateRange.startDate, dateRange.endDate, zohoData, stripeData);
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
      if (!forceRefresh && !dataFromMemoryCache) {
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
  }, [lastFetchTimestamp, checkApiConnectivity, verifyCacheIntegrity, checkMemoryCache, storeInMemoryCache]);

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
