
import { useState, useMemo } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';

export const useIndexPageLogic = () => {
  // PASSIVE MODE: useFinanceData no longer auto-loads data
  const {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData,
    dataInitialized: rawDataInitialized,
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
    hasCachedData
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  
  // Convert financial date range to compatible format for useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  
  const { checkBalanceExists, monthlyBalance, updateMonthlyBalance } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });
  
  const { toast } = useToast();
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

  // FIXED: Properly calculate dataInitialized based on actual user action
  const dataInitialized = useMemo(() => {
    // Data is only initialized when user has explicitly loaded data AND has transactions
    const hasExplicitlyRequestedData = rawDataInitialized && financialData.transactions.length > 0;
    
    console.log("🔍 IndexPageLogic: Data initialization check with FIXED LOGIC", {
      hasExplicitlyRequestedData,
      rawDataInitialized,
      transactionCount: financialData.transactions.length,
      cacheChecked,
      hasCachedData,
      showLoadButton: !hasExplicitlyRequestedData,
      reason: hasExplicitlyRequestedData ? 
        'user_has_loaded_data_successfully' : 
        'waiting_for_user_to_load_data'
    });
    
    return hasExplicitlyRequestedData;
  }, [rawDataInitialized, financialData.transactions.length, cacheChecked, hasCachedData]);

  return {
    // Data state
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData,
    dataInitialized, // Using the fixed calculation
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
    
    // UI state
    showBalanceDialog,
    setShowBalanceDialog,
    
    // Computed values
    currentMonthDate,
    periodTitle,
    totalZohoExpenses,
    
    // Additional hooks
    checkBalanceExists,
    monthlyBalance,
    updateMonthlyBalance,
    toast,
    handleDateRangeChange,
    getDatePickerCurrentMonthRange
  };
};
