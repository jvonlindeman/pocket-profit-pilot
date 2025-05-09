
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/types/financial';
import { useDateRange } from '@/hooks/useDateRange';
import { useStripeIncome } from '@/hooks/useStripeIncome';
import { useFinanceDataFetcher } from '@/hooks/useFinanceDataFetcher';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { useDataLoading } from '@/hooks/useDataLoading';
import { useBalanceSync } from '@/hooks/useBalanceSync';

export const useFinanceData = () => {
  // Use our custom hooks for specific functionality
  const dateRangeHook = useDateRange();
  const { dateRange, updateDateRange, getCurrentMonthRange, isDateInRange } = dateRangeHook;
  
  const { toast } = useToast();
  
  const stripeHook = useStripeIncome();
  const { stripeIncome, stripeOverride, loadStripeIncomeData, setStripeIncome } = stripeHook;
  
  const monthlyBalanceHook = useMonthlyBalance({ currentDate: dateRange.startDate });
  const { balance: startingBalance } = monthlyBalanceHook;
  
  const dataFetcher = useFinanceDataFetcher();
  const {
    financialData,
    loading,
    error,
    dataInitialized,
    setDataInitialized,
    rawResponse,
    regularIncome,
    collaboratorExpenses,
    cacheStatus,
    fetchFinancialData,
    clearCacheAndRefresh: clearCacheFromDataFetcher,
    setFinancialData,
    resetCircuitBreakerState
  } = dataFetcher;
  
  const dataRefresh = useDataRefresh();
  const { 
    isRefreshing, 
    refreshCount, 
    withRefreshProtection, 
    forceManualRefresh: forceManualRefreshAction,
    handleClearCacheAndRefresh,
    handleEmergencyRecovery,
    lastError,
    hasErrors,
    errorCount
  } = dataRefresh;
  
  const dataLoading = useDataLoading();
  const { loadFinancialData } = dataLoading;
  
  const { syncBalance } = useBalanceSync();
  
  // Track data initialization to prevent attempting to refresh before ready
  const wasInitializedRef = useRef<boolean>(false);
  // Track current data range to avoid unnecessary refreshes
  const currentDateRangeRef = useRef<DateRange | null>(null);

  // Reset refresh count when component mounts or date range changes
  useEffect(() => {
    // Only reset counters if the date range has actually changed
    if (!currentDateRangeRef.current || 
        currentDateRangeRef.current.startDate !== dateRange.startDate || 
        currentDateRangeRef.current.endDate !== dateRange.endDate) {
      console.log('🔄 Date range changed, resetting refresh count');
      dataRefresh.resetCircuitBreaker();
      // Update current date range ref
      currentDateRangeRef.current = { ...dateRange };
    }
  }, [dateRange, dataRefresh]);
  
  // Main function to fetch and process financial data
  const refreshData = useCallback(async (forceRefresh: boolean = false) => {
    return await loadFinancialData(
      dateRange,
      isDateInRange,
      loadStripeIncomeData,
      setStripeIncome,
      fetchFinancialData,
      startingBalance,
      withRefreshProtection,
      setDataInitialized,
      toast,
      forceRefresh
    );
  }, [
    dateRange, 
    isDateInRange, 
    loadStripeIncomeData, 
    fetchFinancialData, 
    setDataInitialized, 
    toast, 
    setStripeIncome, 
    startingBalance, 
    withRefreshProtection,
    loadFinancialData
  ]);

  // Clear cache and refresh data
  const clearCacheAndRefreshData = useCallback(async () => {
    return await handleClearCacheAndRefresh(
      clearCacheFromDataFetcher,
      refreshData,
      dateRange
    );
  }, [dateRange, clearCacheFromDataFetcher, refreshData, handleClearCacheAndRefresh]);

  // Manual refresh function that resets circuit breaker and forces refresh
  const forceManualRefresh = useCallback(async () => {
    return await forceManualRefreshAction(refreshData);
  }, [refreshData, forceManualRefreshAction]);

  // Handle emergency recovery - reset all states
  const emergencyRecovery = useCallback(() => {
    return handleEmergencyRecovery(resetCircuitBreakerState);
  }, [handleEmergencyRecovery, resetCircuitBreakerState]);

  // Update data when date range changes - removed startingBalance from dependencies!
  useEffect(() => {
    if (dataInitialized) {
      console.log('📅 Date range changed, refreshing data:', { dateRange });
      refreshData(false);
    }
  }, [dateRange, dataInitialized, refreshData]);

  // Separate effect for debugging initialization state
  useEffect(() => {
    console.log('🔍 Finance data component mounted or data initialized state changed:', { dataInitialized });
    
    // Initial data load if not already initialized
    if (dataInitialized && !wasInitializedRef.current) {
      console.log('🚀 Data initialized but wasInitializedRef is false, setting to true');
      wasInitializedRef.current = true;
    }
  }, [dataInitialized]);

  // Completely separate effect for handling startingBalance changes
  useEffect(() => {
    syncBalance(startingBalance, financialData, setFinancialData, dataInitialized);
  }, [startingBalance, financialData, setFinancialData, dataInitialized, syncBalance]);

  return {
    // Date range management
    dateRange,
    updateDateRange,
    getCurrentMonthRange,
    
    // Financial data
    financialData,
    loading,
    error,
    dataInitialized,
    setDataInitialized,
    
    // Income data
    stripeIncome,
    regularIncome,
    stripeOverride,
    
    // Balance data
    startingBalance,
    
    // Expenses data
    collaboratorExpenses,
    
    // Cache management
    usingCachedData: cacheStatus.usingCachedData,
    partialRefresh: cacheStatus.partialRefresh,
    cacheStats: cacheStatus.stats,
    
    // Debug information
    rawResponse,
    
    // Functions
    refreshData,
    clearCacheAndRefresh: clearCacheAndRefreshData,
    forceManualRefresh,
    emergencyRecovery,
    
    // Status information
    isRefreshing,
    refreshCount,
    
    // Error information
    lastError,
    hasErrors,
    errorCount
  };
};
