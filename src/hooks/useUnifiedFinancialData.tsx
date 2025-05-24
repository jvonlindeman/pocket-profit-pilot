
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@/types/financial';
import { useOptimizedFinancialData } from '@/hooks/queries/useOptimizedFinancialData';

/**
 * Unified hook for financial data management with optimized cache-first approach
 */
export const useUnifiedFinancialData = () => {
  // State for the current date range
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
  
  // References to prevent duplicate calls
  const isFetchingRef = useRef<boolean>(false);
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshCooldownRef = useRef<number>(10000); // 10 second cooldown
  
  // Use the optimized hook only when we have a date range
  const {
    transactions,
    stripeData,
    loading,
    error,
    usingCachedData,
    cacheStatus,
    refetch
  } = useOptimizedFinancialData(
    dateRange?.startDate || new Date(),
    dateRange?.endDate || new Date()
  );

  // State for additional data
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [apiConnectivity, setApiConnectivity] = useState<{
    zoho: boolean,
    stripe: boolean
  }>({
    zoho: true,
    stripe: true
  });

  // Update data initialized flag when we have data
  useEffect(() => {
    if (transactions.length > 0) {
      setDataInitialized(true);
    }
  }, [transactions.length]);

  // Function to check API connectivity (simplified)
  const checkApiConnectivity = useCallback(async () => {
    try {
      // For now, assume APIs are connected if we can load data
      const result = { zoho: true, stripe: true };
      setApiConnectivity(result);
      return result;
    } catch (error) {
      console.error("Error checking API connectivity:", error);
      const result = { zoho: false, stripe: false };
      setApiConnectivity(result);
      return result;
    }
  }, []);

  // Function to check cache status (now provided by the optimized hook)
  const checkCacheStatus = useCallback(async (newDateRange: { startDate: Date; endDate: Date }) => {
    if (!dateRange || 
        dateRange.startDate.getTime() !== newDateRange.startDate.getTime() ||
        dateRange.endDate.getTime() !== newDateRange.endDate.getTime()) {
      setDateRange(newDateRange);
    }
    
    return {
      zoho: { cached: cacheStatus.zoho.hit, partial: cacheStatus.zoho.partial },
      stripe: { cached: cacheStatus.stripe.hit, partial: cacheStatus.stripe.partial }
    };
  }, [dateRange, cacheStatus]);

  // Function to fetch data with throttling
  const fetchData = useCallback(async (
    newDateRange: { startDate: Date; endDate: Date },
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
    
    try {
      // Set the date range to trigger the optimized hook
      setDateRange(newDateRange);
      
      // Wait a bit for the hook to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger the refetch with force refresh if needed
      await refetch(forceRefresh);
      
      // Call the callbacks with the current data
      if (callbacks.onCollaboratorData) {
        callbacks.onCollaboratorData(transactions);
      }
      
      if (callbacks.onIncomeTypes) {
        callbacks.onIncomeTypes(transactions, stripeData);
      }
      
      return true;
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      toast({
        title: "Error",
        description: err.message || "Error al cargar los datos financieros",
        variant: "destructive",
      });
      return false;
    } finally {
      isFetchingRef.current = false;
    }
  }, [refetch, transactions, stripeData]);
  
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

  // Update raw response when stripeData changes
  useEffect(() => {
    if (stripeData) {
      setRawResponse({
        stripe: stripeData,
        cached: usingCachedData,
        cacheStatus
      });
    }
  }, [stripeData, usingCachedData, cacheStatus]);

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
