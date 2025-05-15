
import { useState, useCallback, useMemo } from 'react';
import { Transaction, FinancialData } from '@/types/financial';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { processTransactionData } from '@/services/financialProcessor';
import { FinancialDateRange } from '@/hooks/useFinancialDateRange';

export function useTransactionData(
  dateRange: FinancialDateRange, 
  startingBalance: number, 
  collaboratorExpenses: any[]
) {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  
  // Fetcher hook
  const { 
    loading, 
    error, 
    rawResponse, 
    usingCachedData, 
    fetchFinancialData,
    cacheStatus
  } = useFinancialDataFetcher();

  // Datos financieros procesados - memoized
  const financialData = useMemo(() => {
    console.log("Calculating financial data with collaborator expenses:", collaboratorExpenses);
    return processTransactionData(transactions, startingBalance, collaboratorExpenses);
  }, [transactions, startingBalance, collaboratorExpenses]);

  // Función para cargar los datos 
  const fetchData = useCallback(async (
    forceRefresh = false,
    processors: {
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (data: any) => void,
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
        onCollaboratorData: processors.onCollaboratorData,
        onIncomeTypes: processors.onIncomeTypes
      }
    );
    return success;
  }, [dateRange, fetchFinancialData]);
  
  // Función pública para refrescar datos
  const refreshData = useCallback((
    force = false, 
    processors: {
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (data: any) => void,
    }
  ) => {
    return fetchData(force, processors);
  }, [fetchData]);

  return {
    transactions,
    financialData,
    dataInitialized,
    loading,
    error,
    rawResponse,
    refreshData,
    usingCachedData,
    cacheStatus
  };
}
