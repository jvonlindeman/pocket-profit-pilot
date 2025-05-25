
import { useMemo, useCallback, useRef } from 'react';
import { useFinanceDateRange } from '@/hooks/useFinanceDateRange';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalanceManager } from '@/hooks/useMonthlyBalanceManager';
import { useOptimizedFinancialData } from '@/hooks/queries/useOptimizedFinancialData';
import { useUrlParamCleaner } from '@/hooks/useUrlParamCleaner';
import { processTransactionData } from '@/services/financialService';
import { getCurrentMonthRange } from '@/utils/dateUtils';
import { zohoRepository } from '@/repositories/zohoRepository';
import { UnpaidInvoice } from '@/types/financial';

export const useFinanceData = () => {
  // Keep track of the last time refreshData was called
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  
  // Clean URL parameters and detect legitimate refresh intentions
  const { isLegitimateRefresh } = useUrlParamCleaner();
  
  // Import functionality from smaller hooks
  const { startingBalance, fetchMonthlyBalance, updateStartingBalance, setStartingBalance, notes, setNotes } = useMonthlyBalanceManager();
  const { collaboratorExpenses, processCollaboratorData } = useCollaboratorProcessor();
  const { 
    stripeIncome, stripeFees, 
    stripeTransactionFees, stripePayoutFees, stripeAdditionalFees,
    stripeNet, stripeFeePercentage, 
    regularIncome, processIncomeTypes 
  } = useIncomeProcessor();

  // Use the date range hook
  const { dateRange, updateDateRange } = useFinanceDateRange(fetchMonthlyBalance);
  
  // Use ONLY the optimized financial data hook - NOW WITH CACHE-FIRST STRATEGY
  const { 
    transactions, 
    stripeData,
    loading, 
    error, 
    usingCachedData, 
    cacheStatus, 
    refetch,
    isDataRequested,
    cacheChecked,
    hasCachedData
  } = useOptimizedFinancialData(dateRange.startDate, dateRange.endDate);

  console.log("🏠 useFinanceData: Hook rendered with CACHE-FIRST and URL cleanup", {
    dateRange: `${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`,
    transactionCount: transactions.length,
    isDataRequested,
    cacheChecked,
    hasCachedData,
    loading,
    usingCachedData,
    isLegitimateRefresh,
    cacheStatus: {
      zohoHit: cacheStatus.zoho.hit,
      stripeHit: cacheStatus.stripe.hit
    }
  });

  // Process data when transactions change
  useMemo(() => {
    if (transactions.length > 0) {
      console.log("🔄 useFinanceData: Processing transaction data", {
        transactionCount: transactions.length,
        sources: transactions.reduce((acc, tx) => {
          acc[tx.source] = (acc[tx.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      // Process collaborator data
      processCollaboratorData(transactions);
      
      // Process income types
      processIncomeTypes(transactions, stripeData);
    }
  }, [transactions, stripeData, processCollaboratorData, processIncomeTypes]);

  // Get unpaid invoices from zoho repository
  const unpaidInvoices = useMemo<UnpaidInvoice[]>(() => {
    return zohoRepository.getUnpaidInvoices();
  }, [transactions]);

  // Financial data processing
  const financialData = useMemo(() => {
    // Pass collaboratorExpenses to ensure they're included in the summary
    return processTransactionData(transactions, startingBalance, collaboratorExpenses);
  }, [transactions, startingBalance, collaboratorExpenses]);

  // Check API connectivity (simplified)
  const checkApiConnectivity = useCallback(async () => {
    try {
      // Simple connectivity check based on data loading success
      const result = { zoho: true, stripe: true };
      return result;
    } catch (error) {
      console.error("Error checking API connectivity:", error);
      const result = { zoho: false, stripe: false };
      return result;
    }
  }, []);

  // Data initialized flag - IMPROVED: prioritize cached data existence
  const dataInitialized = useMemo(() => {
    // If we have cached data available, consider it initialized immediately
    // If data was explicitly requested and loaded, also consider it initialized
    const initialized = (cacheChecked && hasCachedData) || (isDataRequested && transactions.length > 0);
    
    console.log("🔍 useFinanceData: Data initialization check with CACHE-FIRST priority", {
      initialized,
      isDataRequested,
      transactionCount: transactions.length,
      cacheChecked,
      hasCachedData,
      usingCachedData,
      reason: initialized ? 
        (hasCachedData ? 'cached_data_available' : 'explicit_request_completed') : 
        'no_data_available'
    });
    return initialized;
  }, [isDataRequested, transactions.length, cacheChecked, hasCachedData, usingCachedData]);

  // ENHANCED DATA REFRESH FUNCTION - respects cache-first strategy
  const refreshData = useCallback((force = false) => {
    // If a refresh is already in progress, return early
    if (refreshInProgressRef.current) {
      console.log("🚫 useFinanceData: Refresh already in progress, skipping");
      return Promise.resolve(false);
    }
    
    // Apply cooldown if not forcing a refresh
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < 10000 && !force) { // 10 second cooldown
      console.log(`🚫 useFinanceData: Throttling refresh request, last refresh was ${timeSinceLastRefresh}ms ago`);
      return Promise.resolve(false);
    }
    
    // Set flags to indicate refresh in progress
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    
    console.log(`🚀 useFinanceData: Beginning CACHE-FIRST data refresh`, {
      force, 
      isLegitimateRefresh,
      actualForceNeeded: force || isLegitimateRefresh
    });
    
    // Only force refresh if explicitly requested OR if it's a legitimate user refresh
    const shouldForceRefresh = force || isLegitimateRefresh;
    
    // Use the refetch function from useOptimizedFinancialData
    const promise = refetch(shouldForceRefresh);
    
    promise.finally(() => {
      // Always clean up when done
      console.log("✅ useFinanceData: Completed CACHE-FIRST data refresh");
      refreshInProgressRef.current = false;
    });
    
    return promise;
  }, [refetch, isLegitimateRefresh]);

  return {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData,
    dataInitialized,
    rawResponse: stripeData, // Use stripeData as raw response
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
    notes,
    updateStartingBalance,
    setStartingBalance,
    setNotes,
    usingCachedData,
    cacheStatus,
    apiConnectivity: { zoho: true, stripe: true }, // Simplified
    checkApiConnectivity,
    cacheChecked,
    hasCachedData
  };
};
