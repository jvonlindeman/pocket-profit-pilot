
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

  // Calculate total Zoho expenses - all expenses except those from Stripe
  const totalZohoExpenses = useMemo(() => 
    financialData.transactions
      .filter(tx => tx.type === 'expense' && tx.source !== 'Stripe')
      .reduce((sum, tx) => sum + tx.amount, 0),
    [financialData.transactions]
  );

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
  console.log("💼 DashboardStateManager: Transaction count:", financialData.transactions.length);
  console.log("💼 DashboardStateManager: Zoho income transactions:", 
    financialData.transactions.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length
  );
  console.log("💼 DashboardStateManager: Unpaid invoices:", unpaidInvoices?.length || 0);
  console.log("💼 DashboardStateManager: Is refreshing:", isRefreshing);
  console.log("💼 DashboardStateManager: Include Zoho 50% (TRACKING):", includeZohoFiftyPercent);

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
    refreshData: enhancedRefreshData,
    handleDateRangeChange,
    getDatePickerCurrentMonthRange,
    
    // Global state
    globalRefreshInProgress,
  };
};
