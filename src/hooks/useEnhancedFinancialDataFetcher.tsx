import { useState, useCallback, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { Transaction } from '@/types/financial';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { useThrottledFetch } from '@/hooks/useThrottledFetch';
import { useUrlParamCleaner } from '@/hooks/useUrlParamCleaner';

/**
 * Enhanced hook to handle fetching of financial data with transaction management
 * and throttling to prevent duplicate API calls
 * Simplified to not use persistent cache management
 */
export const useEnhancedFinancialDataFetcher = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  
  // Use smaller, focused hooks
  const { executeThrottledFetch, cleanup } = useThrottledFetch(1000);
  
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
        title: "Datos financieros actualizados",
        description: `Se procesaron ${transactions.length} transacciones`
      });
    }
    
    return success;
  }, [fetchFinancialData, transactions.length]);

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

  // Cleanup function - no-op stub for cache cleanup
  const cleanupCache = useCallback(async () => {
    // No-op since we no longer use persistent cache
    return 0;
  }, []);

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
    cleanupCache
  };
};
