
import { useState, useCallback, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { Transaction } from '@/types/financial';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { useSearchParams } from 'react-router-dom';

/**
 * Enhanced hook to handle fetching of financial data with transaction management
 */
export const useEnhancedFinancialDataFetcher = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  // Remove refresh parameter from URL if present
  useEffect(() => {
    if (searchParams.has('refresh')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Function to fetch data
  const fetchData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false,
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
  }, [
    fetchFinancialData, 
    transactions.length,
    usingCachedData
  ]);
  
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
    refreshData
  };
};
