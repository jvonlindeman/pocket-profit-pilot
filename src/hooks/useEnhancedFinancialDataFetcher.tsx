
import { useState, useCallback, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { Transaction } from '@/types/financial';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { useThrottledFetch } from '@/hooks/useThrottledFetch';
import { useCacheManagement } from '@/hooks/useCacheManagement';
import { useUrlParamCleaner } from '@/hooks/useUrlParamCleaner';
import { useStripeDebug } from '@/hooks/useStripeDebug';

/**
 * Enhanced hook to handle fetching of financial data with transaction management
 * and throttling to prevent duplicate API calls
 */
export const useEnhancedFinancialDataFetcher = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  
  // Use smaller, focused hooks
  const { executeThrottledFetch, cleanup } = useThrottledFetch(1000);
  const { fixLegacyCacheEntries, cleanupCache } = useCacheManagement();
  const { debugStripeCaching } = useStripeDebug();
  
  // Handle URL parameter cleanup
  useUrlParamCleaner();
  
  const { 
    loading, 
    error, 
    rawResponse, 
    usingCachedData, 
    fetchFinancialData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity
  } = useFinancialDataFetcher();

  // Check if we need to fix any legacy cache entries with missing year/month values
  useEffect(() => {
    fixLegacyCacheEntries();
  }, [fixLegacyCacheEntries]);

  // Actual fetch execution logic
  const executeFetchData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: {
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void
    }
  ) => {
    const success = await fetchFinancialData(
      dateRange,
      forceRefresh,
      {
        onTransactions: (combinedData) => {
          setTransactions(combinedData);
          setDataInitialized(true);
        },
        onCollaboratorData: callbacks.onCollaboratorData,
        onIncomeTypes: callbacks.onIncomeTypes
      }
    );
    
    if (success && transactions.length > 0) {
      toast({
        title: usingCachedData ? "Datos financieros cargados desde caché" : "Datos financieros actualizados",
        description: `Se procesaron ${transactions.length} transacciones${usingCachedData ? " (desde caché)" : ""}`
      });
    }
    
    return success;
  }, [fetchFinancialData, transactions.length, usingCachedData]);

  // Function to fetch data with throttling
  const fetchData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false,
    callbacks: {
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void
    }
  ) => {
    return executeThrottledFetch(
      () => executeFetchData(dateRange, forceRefresh, callbacks),
      forceRefresh
    );
  }, [executeThrottledFetch, executeFetchData]);
  
  // Public function to refresh data
  const refreshData = useCallback((force = false) => {
    if (force) {
      toast({
        title: "Forzando actualización",
        description: "Obteniendo datos frescos desde la API"
      });
    }
    
    return fetchData; // Return the fetchData function for later use
  }, [fetchData]);

  // Cleanup function
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
    cleanupCache,
    debugStripeCaching
  };
};
