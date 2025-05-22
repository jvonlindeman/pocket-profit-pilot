
import { useState, useCallback } from 'react';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { Transaction } from '@/types/financial';

export const useEnhancedFinancialDataFetcher = () => {
  // Use the base data fetcher hook
  const {
    loading,
    error,
    rawResponse,
    fetchFinancialData,
    apiConnectivity,
    checkApiConnectivity
  } = useFinancialDataFetcher();

  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);

  // Function to fetch data with prepared callbacks
  const fetchData = useCallback((
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: {
      onTransactions?: (transactions: Transaction[]) => void;
      onCollaboratorData?: (data: any) => void;
      onIncomeTypes?: (transactions: Transaction[], stripeData: any) => void;
    } = {}
  ) => {
    if (!dateRange.startDate || !dateRange.endDate) {
      console.error("Invalid date range:", dateRange);
      return Promise.resolve(false);
    }

    // Prepare callbacks
    const preparedCallbacks = {
      onTransactions: (loadedTransactions: Transaction[]) => {
        setTransactions(loadedTransactions);
        console.log("useEnhancedFinancialDataFetcher - Loaded transactions:", loadedTransactions.length);
        
        if (callbacks.onTransactions) {
          callbacks.onTransactions(loadedTransactions);
        }
        
        // Also trigger income types processing if callback provided
        if (callbacks.onIncomeTypes) {
          const stripeData = rawResponse?.stripe || null;
          callbacks.onIncomeTypes(loadedTransactions, stripeData);
        }
        
        // Mark data as initialized once we have transactions
        setDataInitialized(true);
      },
      onCollaboratorData: callbacks.onCollaboratorData || (() => {}),
      onIncomeTypes: () => {} // This is handled in onTransactions
    };
    
    // Call the base fetch method with callbacks
    return fetchFinancialData(dateRange, forceRefresh, preparedCallbacks);
  }, [fetchFinancialData, rawResponse?.stripe]);

  // Function that returns a refresh function with prepared arguments
  const getRefreshFunction = useCallback((force: boolean = false) => {
    return fetchData;
  }, [fetchData]);

  return {
    loading,
    error,
    transactions,
    rawResponse,
    dataInitialized,
    apiConnectivity,
    checkApiConnectivity,
    fetchData,
    refreshData: getRefreshFunction
  };
};
