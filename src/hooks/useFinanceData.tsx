
import { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance'; // Updated import
import * as ZohoService from '@/services/zohoService';
import { formatDateYYYYMMDD, getCurrentMonthRange } from '@/utils/dateUtils';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';
import type { DateRange } from 'react-day-picker';
import { Transaction, FinancialData, normalizeSummary, CategorySummary } from '@/types/financial';

// Enhanced transaction data processor that accepts collaborator expenses
const processTransactionData = (
  transactions: Transaction[], 
  startingBalance: number = 0,
  collaboratorExpenses: CategorySummary[] = []
): FinancialData => {
  // Calculate total collaborator expense
  const totalCollaboratorExpense = collaboratorExpenses.reduce((sum, item) => sum + item.amount, 0);
  
  console.log("Processing transactions with collaborator expenses:", {
    transactionCount: transactions.length,
    totalCollaboratorExpense,
    collaboratorExpensesCount: collaboratorExpenses.length
  });
  
  // Process transactions as before
  const summary = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    collaboratorExpense: totalCollaboratorExpense, // Set from calculated value
    otherExpense: 0, // This will be calculated below
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
  
  // Calculate other expense (total expense minus collaborator expense)
  summary.otherExpense = summary.totalExpenses - totalCollaboratorExpense;
  
  // Calculate profits
  summary.netProfit = summary.totalIncome - summary.totalExpenses;
  summary.profit = summary.startingBalance + summary.totalIncome - summary.totalExpenses;
  summary.profitMargin = summary.totalIncome > 0 ? (summary.profit / summary.totalIncome) * 100 : 0;
  summary.grossProfit = summary.totalIncome;
  summary.grossProfitMargin = summary.totalIncome > 0 ? 100 : 0;
  
  // Group expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = {
          category,
          amount: 0,
          percentage: 0
        };
      }
      acc[category].amount += transaction.amount;
      return acc;
    }, {} as Record<string, CategorySummary>);

  // Calculate percentages for each category
  const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.amount, 0);
  const expenseByCategory = Object.values(expensesByCategory).map(cat => {
    cat.percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
    return cat;
  }).sort((a, b) => b.amount - a.amount);
  
  // Group income by source
  const incomeBySource = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, transaction) => {
      const source = transaction.source || 'Sin fuente';
      if (!acc[source]) {
        acc[source] = {
          category: source,
          amount: 0,
          percentage: 0
        };
      }
      acc[source].amount += transaction.amount;
      return acc;
    }, {} as Record<string, CategorySummary>);

  // Calculate percentages for each source
  const totalIncome = Object.values(incomeBySource).reduce((sum, src) => sum + src.amount, 0);
  const incomeBySourceArray = Object.values(incomeBySource).map(src => {
    src.percentage = totalIncome > 0 ? (src.amount / totalIncome) * 100 : 0;
    return src;
  }).sort((a, b) => b.amount - a.amount);

  // Return enhanced financial data structure
  return {
    summary: normalizeSummary(summary),
    transactions,
    incomeBySource: incomeBySourceArray,
    expenseByCategory,
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

  // Use the consolidated hook for monthly balance management
  // Changed from useMonthlyBalanceManager to useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  const { 
    monthlyBalance, 
    fetchMonthlyBalance, 
    updateMonthlyBalance,
    startingBalance, 
    setStartingBalance
  } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });

  // Import functionality from smaller hooks
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
    cacheStatus
  } = useFinancialDataFetcher();

  // Datos financieros procesados
  const financialData = useMemo(() => {
    console.log("Calculating financial data with collaborator expenses:", collaboratorExpenses);
    return processTransactionData(transactions, startingBalance, collaboratorExpenses);
  }, [transactions, startingBalance, collaboratorExpenses]);

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
    fetchMonthlyBalance();
    
    // Check if we need to refresh the cache
    ZohoService.checkAndRefreshCache(preservedStartDate, preservedEndDate);
  }, [fetchMonthlyBalance]);

  // When dateRange changes, make sure we fetch monthly balance
  useEffect(() => {
    fetchMonthlyBalance();
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
    updateStartingBalance: setStartingBalance, // Updated to match the consolidated hook
    usingCachedData,
    cacheStatus
  };
};
