
import { useState, useMemo } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { UnpaidInvoice } from '@/types/financial';

export const useDashboardStateManager = () => {
  console.log("🏠 DashboardStateManager: Initializing...");
  
  // PASSIVE MODE: useFinanceData no longer auto-loads data
  const {
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
    unpaidInvoices,
    startingBalance,
    updateStartingBalance,
    setStartingBalance,
    usingCachedData,
    cacheStatus,
    cacheChecked,
    hasCachedData,
    isRefreshing // Add isRefreshing state from useFinanceData
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  
  // Convert financial date range to compatible format for useMonthlyBalance
  // Add defensive check for dateRange.startDate
  const currentMonthDate = dateRange?.startDate || new Date();
  
  console.log("🏠 DashboardStateManager: Current month date:", currentMonthDate);
  
  const { checkBalanceExists, monthlyBalance, updateMonthlyBalance } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });
  
  const { handleDateRangeChange, getDatePickerCurrentMonthRange } = useDateRangeManager({
    dateRange,
    updateDateRange,
    getCurrentMonthRange
  });
  
  const { createPeriodTitle } = useDateFormatter();
  
  // Title of the period - add defensive check
  const periodTitle = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      return 'Sin fecha seleccionada';
    }
    return createPeriodTitle(dateRange.startDate, dateRange.endDate);
  }, [createPeriodTitle, dateRange?.startDate, dateRange?.endDate]);

  // Calculate total Zoho expenses - all expenses except those from Stripe
  // Add defensive check for financialData.transactions
  const totalZohoExpenses = useMemo(() => {
    if (!financialData?.transactions || !Array.isArray(financialData.transactions)) {
      return 0;
    }
    return financialData.transactions
      .filter(tx => tx.type === 'expense' && tx.source !== 'Stripe')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [financialData?.transactions]);

  // Enhanced debugging and improved value extraction logic
  console.log("💼 DashboardStateManager: Monthly balance data received:", monthlyBalance);
  
  // IMMEDIATE VALUES: Use the most current values with better defaults - FIXED: Added include_zoho_fifty_percent
  const opexAmount = monthlyBalance?.opex_amount ?? 35;
  const itbmAmount = monthlyBalance?.itbm_amount ?? 0;
  const profitPercentage = monthlyBalance?.profit_percentage ?? 1;
  const taxReservePercentage = monthlyBalance?.tax_reserve_percentage ?? 5;
  const includeZohoFiftyPercent = monthlyBalance?.include_zoho_fifty_percent ?? true;
  
  console.log("💼 DashboardStateManager: IMMEDIATE VALUES for calculator (FIXED):", { 
    opexAmount, 
    itbmAmount, 
    profitPercentage, 
    taxReservePercentage,
    includeZohoFiftyPercent, // NOW INCLUDED
    startingBalance,
    monthlyBalanceId: monthlyBalance?.id,
    monthlyBalanceTimestamp: monthlyBalance?.updated_at,
    isRefreshing,
    timestamp: new Date().toISOString()
  });
  
  // REACTIVE KEY: Forces complete re-render when ANY value changes - FIXED: Added includeZohoFiftyPercent
  const calculatorKey = `calculator-${monthlyBalance?.id || 'default'}-${monthlyBalance?.updated_at || Date.now()}-${startingBalance}-${opexAmount}-${itbmAmount}-${profitPercentage}-${taxReservePercentage}-${includeZohoFiftyPercent}`;
  
  console.log("💼 DashboardStateManager: Calculator key (forces re-render - FIXED):", calculatorKey);
  console.log("💼 DashboardStateManager: Transaction count:", financialData?.transactions?.length || 0);
  console.log("💼 DashboardStateManager: Zoho income transactions:", 
    financialData?.transactions?.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length || 0
  );
  console.log("💼 DashboardStateManager: Unpaid invoices:", unpaidInvoices?.length || 0);
  console.log("💼 DashboardStateManager: Is refreshing:", isRefreshing);
  console.log("💼 DashboardStateManager: Include Zoho 50% (TRACKING):", includeZohoFiftyPercent);

  return {
    // Data state
    dateRange,
    financialData: financialData || { summary: { totalIncome: 0, totalExpense: 0, collaboratorExpense: 0, otherExpense: 0, profit: 0, profitMargin: 0, grossProfit: 0, grossProfitMargin: 0 }, transactions: [], expenseByCategory: [] },
    loading,
    error,
    dataInitialized,
    rawResponse,
    usingCachedData,
    cacheStatus,
    cacheChecked,
    hasCachedData,
    isRefreshing,
    
    // Financial data
    stripeIncome: stripeIncome || 0,
    stripeFees: stripeFees || 0,
    stripeTransactionFees: stripeTransactionFees || 0,
    stripePayoutFees: stripePayoutFees || 0,
    stripeAdditionalFees: stripeAdditionalFees || 0,
    stripeNet: stripeNet || 0,
    stripeFeePercentage: stripeFeePercentage || 0,
    regularIncome: regularIncome || 0,
    collaboratorExpenses: collaboratorExpenses || [],
    unpaidInvoices: unpaidInvoices || [],
    startingBalance: startingBalance || 0,
    totalZohoExpenses,
    
    // Derived values
    periodTitle,
    currentMonthDate,
    calculatorKey,
    opexAmount,
    itbmAmount,
    profitPercentage,
    taxReservePercentage,
    includeZohoFiftyPercent, // NOW EXPORTED
    
    // Monthly balance
    monthlyBalance,
    checkBalanceExists,
    updateMonthlyBalance,
    setStartingBalance,
    
    // UI state
    showBalanceDialog,
    setShowBalanceDialog,
    
    // Functions
    refreshData,
    handleDateRangeChange,
    getDatePickerCurrentMonthRange,
  };
};
