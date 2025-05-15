
import { useState, useCallback, useRef, useEffect } from 'react';
import * as ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { formatDateYYYYMMDD, logDateInfo } from '@/utils/dateUtils';
import { toast } from '@/components/ui/use-toast';
import { CLIENT_CACHE_KEY_PREFIX, CACHE_DURATION } from '@/services/zoho/api/config';
import { Transaction } from '@/types/financial';
import { useCacheContext } from '@/contexts/CacheContext';
import { logCacheEvent } from '@/hooks/useCacheMonitoring';

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
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  const [apiConnectivity, setApiConnectivity] = useState<{
    zoho: boolean,
    stripe: boolean
  }>({
    zoho: true,
    stripe: true
  });

  // Access the cache context
  const { 
    status: cacheStatus, 
    isUsingCache, 
    checkCache, 
    storeTransactions,
    verifyCacheIntegrity
  } = useCacheContext();

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
    partial?: boolean;
  } => {
    const now = Date.now();
    const dateRangeKey = generateDateRangeKey(startDate, endDate);
    
    console.log("FinancialDataFetcher: Checking memory cache for", dateRangeKey);
    
    // Clean expired entries
    memoryCache.current = memoryCache.current.filter(entry => entry.expiresAt > now);
    
    // Find matching entry
    const cacheEntry = memoryCache.current.find(entry => entry.dateRangeKey === dateRangeKey);
    
    if (cacheEntry) {
      console.log("FinancialDataFetcher: Found data in memory cache for range:", dateRangeKey);
      // Log memory cache hit
      logCacheEvent('hit', 'memory', { dateRangeKey }, { startDate, endDate });
      
      return {
        found: true,
        zohoData: cacheEntry.zohoData,
        stripeData: cacheEntry.stripeData,
        partial: false
      };
    }
    
    // Log memory cache miss
    logCacheEvent('miss', 'memory', { dateRangeKey }, { startDate, endDate });
    return { found: false };
  }, [generateDateRangeKey]);

  // Store data in memory cache
  const storeInMemoryCache = useCallback((startDate: Date, endDate: Date, zohoData: any[], stripeData: any) => {
    const dateRangeKey = generateDateRangeKey(startDate, endDate);
    const now = Date.now();
    
    console.log("FinancialDataFetcher: Storing data in memory cache for range:", dateRangeKey);
    
    // Log memory cache store
    logCacheEvent('store', 'memory', {
      zohoCount: zohoData.length,
      stripeCount: stripeData.transactions ? stripeData.transactions.length : 0
    }, { startDate, endDate });
    
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
    
    // Limit cache size to 10 entries
    if (memoryCache.current.length > 10) {
      memoryCache.current.sort((a, b) => b.timestamp - a.timestamp);
      memoryCache.current = memoryCache.current.slice(0, 10);
    }
  }, [generateDateRangeKey]);

  // Check API connectivity
  const checkApiConnectivity = useCallback(async () => {
    console.log("FinancialDataFetcher: Checking API connectivity");
    const zohoConnected = await ZohoService.checkApiConnectivity();
    const stripeConnected = await StripeService.checkApiConnectivity();
    
    console.log("FinancialDataFetcher: API connectivity -", { zoho: zohoConnected, stripe: stripeConnected });
    
    setApiConnectivity({
      zoho: zohoConnected,
      stripe: stripeConnected
    });
    
    return { zoho: zohoConnected, stripe: stripeConnected };
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
      console.log("FinancialDataFetcher: Skipping fetch, too soon since last fetch");
      return false;
    }
    
    setLastFetchTimestamp(now);
    console.log("FinancialDataFetcher: Fetching financial data for", dateRange.startDate, "to", dateRange.endDate);
    console.log("FinancialDataFetcher: Force refresh?", forceRefresh);
    
    setLoading(true);
    setError(null);

    try {
      // Check if we have this data in memory cache first (only if not forcing a refresh)
      let zohoData: any[] = [];
      let stripeData: any = { transactions: [] };
      let dataFromMemoryCache = false;
      
      if (!forceRefresh) {
        const memoryCacheResult = checkMemoryCache(dateRange.startDate, dateRange.endDate);
        
        if (memoryCacheResult.found && memoryCacheResult.zohoData && memoryCacheResult.stripeData) {
          console.log("FinancialDataFetcher: Using data from memory cache");
          zohoData = memoryCacheResult.zohoData;
          stripeData = memoryCacheResult.stripeData;
          dataFromMemoryCache = true;
          
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
          
          console.log("FinancialDataFetcher: Finished processing memory cache data");
          
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
        // Check zoho cache
        await verifyCacheIntegrity('Zoho', dateRange.startDate, dateRange.endDate);
        
        // Check stripe cache
        await verifyCacheIntegrity('Stripe', dateRange.startDate, dateRange.endDate);
      }

      // Log exact date objects for debugging
      logDateInfo("FinancialDataFetcher: Original dateRange from datepicker", dateRange);
      
      // Get transactions from Zoho Books - should check server cache internally
      if (!dataFromMemoryCache) {
        console.log("FinancialDataFetcher: Fetching from Zoho");
        // First check our database cache
        const zohoResult = await checkCache('Zoho', dateRange.startDate, dateRange.endDate, forceRefresh);
        
        // Get transactions from Zoho (with cache check in service)
        zohoData = await ZohoService.getTransactions(
          dateRange.startDate, 
          dateRange.endDate,
          forceRefresh
        );
        
        // If it wasn't cached and we got data, store it in our cache
        if (!zohoResult.cached && zohoData && zohoData.length > 0) {
          await storeTransactions('Zoho', dateRange.startDate, dateRange.endDate, zohoData);
        }
        
        // Get the current raw response for debugging
        const rawData = ZohoService.getLastRawResponse();
        setRawResponse(rawData);
        
        // Process collaborator data
        callbacks.onCollaboratorData(rawData);
      }
      
      // Get transactions from Stripe if not already loaded from memory cache
      if (!dataFromMemoryCache) {
        console.log("FinancialDataFetcher: Fetching from Stripe:", dateRange.startDate, dateRange.endDate);
        // First check our database cache
        const stripeResult = await checkCache('Stripe', dateRange.startDate, dateRange.endDate, forceRefresh);
        
        // Get transactions from Stripe (with cache check in service)
        stripeData = await StripeService.getTransactions(
          dateRange.startDate,
          dateRange.endDate,
          forceRefresh
        );
        
        // If it wasn't cached and we got data, store it in our cache
        if (!stripeResult.cached && stripeData && stripeData.transactions && stripeData.transactions.length > 0) {
          await storeTransactions('Stripe', dateRange.startDate, dateRange.endDate, stripeData.transactions);
        }
      }
      
      // Store in memory cache for future use if not already there and not forcing refresh
      if (!dataFromMemoryCache && !forceRefresh) {
        storeInMemoryCache(dateRange.startDate, dateRange.endDate, zohoData, stripeData);
      }
      
      // Combine the data
      const combinedData = [...zohoData, ...stripeData.transactions];
      console.log("FinancialDataFetcher: Combined transactions:", combinedData.length);
      
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
  }, [lastFetchTimestamp, checkApiConnectivity, checkMemoryCache, storeInMemoryCache, checkCache, storeTransactions, verifyCacheIntegrity]);

  return {
    loading,
    error,
    rawResponse,
    usingCachedData: isUsingCache,
    fetchFinancialData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity
  };
};
