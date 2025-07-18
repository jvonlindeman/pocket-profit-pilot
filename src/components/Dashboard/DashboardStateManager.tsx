
import { useState, useMemo, useRef } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { UnpaidInvoice } from '@/types/financial';

export const useDashboardStateManager = () => {
  const [globalRefreshInProgress, setGlobalRefreshInProgress] = useState(false);
  const refreshCancelRef = useRef<AbortController | null>(null);

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
    startingBalance,
    updateStartingBalance,
    setStartingBalance,
    usingCachedData,
    cacheStatus,
    cacheChecked,
    hasCachedData,
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

  // ENHANCED Calculate total Zoho expenses - with detailed logging
  const totalZohoExpenses = useMemo(() => {
    const zohoExpenses = financialData.transactions
      .filter(tx => tx.type === 'expense' && tx.source === 'Zoho');
    
    const total = zohoExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log("💰 DashboardStateManager: ENHANCED Total Zoho Expenses Calculation", {
      allTransactions: financialData.transactions.length,
      zohoTransactions: financialData.transactions.filter(tx => tx.source === 'Zoho').length,
      zohoExpenses: zohoExpenses.length,
      totalZohoExpenseAmount: total,
      zohoExpenseBreakdown: zohoExpenses.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        category: tx.category,
        description: tx.description?.substring(0, 50),
        date: tx.date
      })),
      expectedResult: 'Should be > 0 if Zoho has expense data'
    });
    
    return total;
  }, [financialData.transactions]);

  // Enhanced debugging and improved value extraction logic
  console.log("💼 DashboardStateManager: Monthly balance data received:", monthlyBalance);
  
  // IMMEDIATE VALUES: Use the most current values with better defaults
  const opexAmount = monthlyBalance?.opex_amount ?? 35;
  const itbmAmount = monthlyBalance?.itbm_amount ?? 0;
  const profitPercentage = monthlyBalance?.profit_percentage ?? 1;
  const taxReservePercentage = monthlyBalance?.tax_reserve_percentage ?? 5;
  const includeZohoFiftyPercent = monthlyBalance?.include_zoho_fifty_percent ?? true;
  
  console.log("💼 DashboardStateManager: ENHANCED VALUES for calculator:", { 
    opexAmount, 
    itbmAmount, 
    profitPercentage, 
    taxReservePercentage,
    includeZohoFiftyPercent,
    startingBalance,
    totalZohoExpenses, // ENHANCED: Now tracked separately
    monthlyBalanceId: monthlyBalance?.id,
    monthlyBalanceTimestamp: monthlyBalance?.updated_at,
    isRefreshing,
    timestamp: new Date().toISOString()
  });
  
  // ENHANCED REACTIVE KEY: More granular with timestamp for better synchronization
  const calculatorKey = `calculator-${monthlyBalance?.id || 'default'}-${monthlyBalance?.updated_at || Date.now()}-${startingBalance}-${opexAmount}-${itbmAmount}-${profitPercentage}-${taxReservePercentage}-${includeZohoFiftyPercent}-${totalZohoExpenses}-${Date.now()}`;
  
  console.log("💼 DashboardStateManager: Enhanced calculator key (forces re-render):", calculatorKey);
  console.log("💼 DashboardStateManager: ENHANCED immediate calculator values:", {
    opexAmount, itbmAmount, profitPercentage, taxReservePercentage, includeZohoFiftyPercent, startingBalance, totalZohoExpenses
  });
  
  // ENHANCED TRANSACTION LOGGING
  console.log("💼 DashboardStateManager: ENHANCED Transaction analysis:", {
    totalTransactions: financialData.transactions.length,
    zohoIncomeTransactions: financialData.transactions.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length,
    zohoExpenseTransactions: financialData.transactions.filter(tx => tx.type === 'expense' && tx.source === 'Zoho').length,
    stripeTransactions: financialData.transactions.filter(tx => tx.source === 'Stripe').length,
    isRefreshing,
    includeZohoFiftyPercent,
    totalZohoExpensesCalculated: totalZohoExpenses
  });

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
      console.log(`🔄 DashboardStateManager: Starting ENHANCED refresh operation [${requestId}] - Force: ${force}`);
      
      const result = await refreshData(force);
      
      console.log(`✅ DashboardStateManager: ENHANCED refresh completed [${requestId}] - Success: ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ DashboardStateManager: ENHANCED refresh failed [${requestId}]:`, error);
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
    usingCachedData,
    cacheStatus,
    cacheChecked,
    hasCachedData,
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
    startingBalance,
    totalZohoExpenses, // ENHANCED: Now properly calculated and tracked
    
    // Derived values
    periodTitle,
    currentMonthDate,
    calculatorKey,
    opexAmount,
    itbmAmount,
    profitPercentage,
    taxReservePercentage,
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
