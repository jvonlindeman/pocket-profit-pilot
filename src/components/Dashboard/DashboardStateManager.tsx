import { useState, useMemo, useRef } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';

export const useDashboardStateManager = () => {
  const [globalRefreshInProgress, setGlobalRefreshInProgress] = useState(false);
  const refreshCancelRef = useRef<AbortController | null>(null);

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
    setStartingBalance,
    isRefreshing
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  
  // Convert financial date range to compatible format for useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  
  const { checkBalanceExists, monthlyBalance, updateMonthlyBalance } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });
  
  const { handleDateRangeChange, getDatePickerCurrentMonthRange } = useDateRangeManager({
    dateRange,
    updateDateRange,
    getCurrentMonthRange
  });
  
  const { createPeriodTitle } = useDateFormatter();
  
  // Title of the period
  const periodTitle = useMemo(() => 
    createPeriodTitle(dateRange.startDate, dateRange.endDate),
    [createPeriodTitle, dateRange.startDate, dateRange.endDate]
  );

  // Calculate total Zoho expenses
  const totalZohoExpenses = useMemo(() => {
    const zohoExpenses = financialData.transactions
      .filter(tx => tx.type === 'expense' && tx.source === 'Zoho');
    
    const total = zohoExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log("💰 DashboardStateManager: Total Zoho Expenses", {
      allTransactions: financialData.transactions.length,
      zohoExpenses: zohoExpenses.length,
      totalZohoExpenseAmount: total
    });
    
    return total;
  }, [financialData.transactions]);

  // Monthly balance values with defaults
  const opexAmount = monthlyBalance?.opex_amount ?? 35;
  const itbmAmount = monthlyBalance?.itbm_amount ?? 0;
  const profitPercentage = monthlyBalance?.profit_percentage ?? 1;
  const taxReservePercentage = monthlyBalance?.tax_reserve_percentage ?? 5;
  const stripeSavingsPercentage = monthlyBalance?.stripe_savings_percentage ?? 0;
  const includeZohoFiftyPercent = monthlyBalance?.include_zoho_fifty_percent ?? true;
  
  // Reactive key for calculator re-renders
  const calculatorKey = `calculator-${monthlyBalance?.id || 'default'}-${monthlyBalance?.updated_at || Date.now()}-${startingBalance}-${opexAmount}-${itbmAmount}-${profitPercentage}-${taxReservePercentage}-${includeZohoFiftyPercent}-${totalZohoExpenses}`;

  // Enhanced refresh function with global state management
  const enhancedRefreshData = async (force?: boolean) => {
    // Prevent concurrent refresh operations
    if (globalRefreshInProgress) {
      console.log('🚫 DashboardStateManager: Refresh blocked - operation already in progress');
      return false;
    }

    // Cancel any pending refresh
    if (refreshCancelRef.current) {
      console.log('🚫 DashboardStateManager: Cancelling previous refresh operation');
      refreshCancelRef.current.abort();
    }

    // Create new abort controller for this request
    refreshCancelRef.current = new AbortController();
    const requestId = `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      setGlobalRefreshInProgress(true);
      console.log(`🔄 DashboardStateManager: Starting refresh operation [${requestId}] - Force: ${force}`);
      
      const result = await refreshData(force);
      
      console.log(`✅ DashboardStateManager: Refresh completed [${requestId}] - Success: ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ DashboardStateManager: Refresh failed [${requestId}]:`, error);
      return false;
    } finally {
      setGlobalRefreshInProgress(false);
      refreshCancelRef.current = null;
    }
  };

  return {
    // Data state
    dateRange,
    financialData,
    loading,
    error,
    dataInitialized,
    rawResponse,
    isRefreshing,
    
    // Financial data
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
    totalZohoExpenses,
    
    // Derived values
    periodTitle,
    currentMonthDate,
    calculatorKey,
    opexAmount,
    itbmAmount,
    profitPercentage,
    taxReservePercentage,
    stripeSavingsPercentage,
    includeZohoFiftyPercent,
    
    // Monthly balance
    monthlyBalance,
    checkBalanceExists,
    updateMonthlyBalance,
    setStartingBalance,
    
    // UI state
    showBalanceDialog,
    setShowBalanceDialog,
    
    // Functions
    refreshData: enhancedRefreshData,
    handleDateRangeChange,
    getDatePickerCurrentMonthRange,
    
    // Global state
    globalRefreshInProgress,
  };
};
