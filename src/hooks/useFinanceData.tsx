
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FinancialData, Transaction, MonthlyBalance, DateRange } from '@/types/financial';
import { CacheStats } from '@/types/cache';
import { useDateRange } from '@/hooks/useDateRange';
import { useStripeIncome } from '@/hooks/useStripeIncome';
import { useFinanceDataFetcher, DEFAULT_FINANCIAL_DATA } from '@/hooks/useFinanceDataFetcher';
import { safeParseNumber } from '@/utils/financialUtils';
import ZohoService from '@/services/zohoService';

export const useFinanceData = () => {
  // Use our custom hooks for specific functionality
  const dateRangeHook = useDateRange();
  const { dateRange, updateDateRange, getCurrentMonthRange, isDateInRange } = dateRangeHook;
  
  const stripeHook = useStripeIncome();
  const { stripeIncome, stripeOverride, loadStripeIncomeData } = stripeHook;
  
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
    clearCacheAndRefresh
  } = dataFetcher;

  // Main function to fetch and process financial data
  const refreshData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      // First load Stripe income data
      const stripeData = await loadStripeIncomeData(dateRange, isDateInRange);
      
      // Then fetch the main financial data including Stripe
      await fetchFinancialData(dateRange, forceRefresh, {
        amount: stripeData.amount,
        isOverridden: stripeData.isOverridden
      });
      
    } catch (err) {
      console.error("Error in refreshData:", err);
    }
  }, [dateRange, isDateInRange, loadStripeIncomeData, fetchFinancialData]);

  // Clear cache and refresh data
  const handleClearCacheAndRefresh = useCallback(async () => {
    const success = await clearCacheAndRefresh(dateRange);
    if (success) {
      // Force refresh the data after clearing cache
      await refreshData(true);
    }
  }, [dateRange, clearCacheAndRefresh, refreshData]);

  // Update data when date range changes
  useEffect(() => {
    if (dataInitialized) {
      refreshData(false);
    }
  }, [dateRange, dataInitialized, refreshData]);

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
    
    // Income data
    stripeIncome,
    regularIncome,
    stripeOverride,
    
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
    clearCacheAndRefresh: handleClearCacheAndRefresh,
  };
};
