
import { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalanceManager } from '@/hooks/useMonthlyBalanceManager';
import * as ZohoService from '@/services/zohoService';
import { formatDateYYYYMMDD, getCurrentMonthRange } from '@/utils/dateUtils';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';
import type { DateRange } from 'react-day-picker';
import { Transaction, FinancialData, normalizeSummary } from '@/types/financial';

// Simple transaction data processor
const processTransactionData = (transactions: Transaction[], startingBalance: number = 0): FinancialData => {
  // This is a simple implementation - you might want to implement a more sophisticated processor
  const summary = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    collaboratorExpense: 0, // This would be calculated based on your business logic
    otherExpense: 0, // This would be calculated based on your business logic
    profit: 0,
    profitMargin: 0,
    grossProfit: 0,
    grossProfitMargin: 0,
    startingBalance: startingBalance,
    netProfit: 0,
    transactionCount: transactions.length,
    incomeCount: transactions.filter(t => t.type === 'income').length,
    expenseCount: transactions.filter(t => t.type === 'expense').length,
    avgTransactionSize: transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
  };
  
  // Calculate profits
  summary.netProfit = summary.totalIncome - summary.totalExpenses;
  summary.profit = summary.totalIncome - summary.totalExpenses;
  summary.profitMargin = summary.totalIncome > 0 ? (summary.profit / summary.totalIncome) * 100 : 0;
  summary.grossProfit = summary.totalIncome;
  summary.grossProfitMargin = summary.totalIncome > 0 ? 100 : 0;
  
  // Return basic financial data structure
  return {
    summary: normalizeSummary(summary),
    transactions,
    incomeBySource: [],
    expenseByCategory: [],
    dailyData: {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] }
    },
    monthlyData: {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] },
      profit: { labels: [], values: [] }
    }
  };
};

export const useFinanceData = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  
  // Estado del rango de fechas - configurado para mostrar el mes actual (desde el primer día hasta el último día)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Primer día del mes actual
    const startDate = startOfMonth(today);
    // Último día del mes actual
    const endDate = endOfMonth(today);
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Import functionality from smaller hooks
  const { startingBalance, fetchMonthlyBalance, updateStartingBalance } = useMonthlyBalanceManager();
  const { 
    stripeIncome, stripeFees, 
    stripeTransactionFees, stripePayoutFees, stripeAdditionalFees,
    stripeNet, stripeFeePercentage, 
    regularIncome, processIncomeTypes 
  } = useIncomeProcessor();
  const { collaboratorExpenses, processCollaboratorData } = useCollaboratorProcessor();
  const { 
    loading, 
    error, 
    rawResponse, 
    usingCachedData, 
    fetchFinancialData,
    cacheStatus  // Add cacheStatus from the fetcher hook
  } = useFinancialDataFetcher();

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
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    collaboratorExpenses,
    startingBalance,
    updateStartingBalance,
    usingCachedData,
    cacheStatus
  };
};
