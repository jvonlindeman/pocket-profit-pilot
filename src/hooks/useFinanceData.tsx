
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction } from '@/types/financial';
import { processTransactionData } from '@/services/zoho/utils';
import { endOfMonth, subMonths } from 'date-fns';
import ZohoService from '@/services/zohoService';
import { useMonthlyBalanceManager } from './useMonthlyBalanceManager';
import { useIncomeProcessor } from './useIncomeProcessor';
import { useCollaboratorProcessor } from './useCollaboratorProcessor';
import { useFinancialDataFetcher } from './useFinancialDataFetcher';
import { getCurrentMonthRange } from '@/utils/dateUtils';

export const useFinanceData = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  
  // Estado del rango de fechas - configurado para mostrar desde el último día del mes anterior hasta el último día del mes actual
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Último día del mes anterior
    const startDate = endOfMonth(subMonths(today, 1));
    // Último día del mes actual
    const endDate = endOfMonth(today);
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Import functionality from smaller hooks
  const { startingBalance, fetchMonthlyBalance, updateStartingBalance } = useMonthlyBalanceManager();
  const { stripeIncome, stripeFees, stripeNet, stripeFeePercentage, regularIncome, processIncomeTypes } = useIncomeProcessor();
  const { collaboratorExpenses, processCollaboratorData } = useCollaboratorProcessor();
  const { loading, error, rawResponse, usingCachedData, fetchFinancialData } = useFinancialDataFetcher();

  // Datos financieros procesados
  const financialData = useMemo(() => {
    return processTransactionData(transactions, startingBalance);
  }, [transactions, startingBalance]);

  // Función para actualizar el rango de fechas
  const updateDateRange = useCallback((newRange: { startDate: Date; endDate: Date }) => {
    console.log("Date range updated:", newRange);
    
    // Create shallow copies to preserve the exact selected dates
    const preservedStartDate = new Date(newRange.startDate);
    const preservedEndDate = new Date(newRange.endDate);
    
    setDateRange({
      startDate: preservedStartDate,
      endDate: preservedEndDate
    });

    // Fetch monthly balance when date range changes
    fetchMonthlyBalance(preservedStartDate);
    
    // Check if we need to refresh the cache
    ZohoService.checkAndRefreshCache(preservedStartDate, preservedEndDate);
  }, [fetchMonthlyBalance]);

  // When dateRange changes, make sure we fetch monthly balance
  useEffect(() => {
    fetchMonthlyBalance(dateRange.startDate);
  }, [dateRange.startDate, fetchMonthlyBalance]);

  // Función para cargar los datos 
  const fetchData = useCallback(async (forceRefresh = false) => {
    const success = await fetchFinancialData(
      dateRange,
      forceRefresh,
      {
        onTransactions: (combinedData) => {
          setTransactions(combinedData);
          setDataInitialized(true);
        },
        onCollaboratorData: processCollaboratorData,
        onIncomeTypes: processIncomeTypes
      }
    );
    return success;
  }, [
    dateRange, 
    fetchFinancialData, 
    processCollaboratorData, 
    processIncomeTypes
  ]);
  
  // Función pública para refrescar datos (forzando o no)
  const refreshData = useCallback((force = false) => {
    fetchData(force);
  }, [fetchData]);

  return {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData,
    dataInitialized,
    rawResponse,
    stripeIncome,
    stripeFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    collaboratorExpenses,
    startingBalance,
    updateStartingBalance,
    usingCachedData
  };
};
