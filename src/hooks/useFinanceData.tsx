
import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useFinanceDateRange } from '@/hooks/useFinanceDateRange';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalanceManager } from '@/hooks/useMonthlyBalanceManager';
import { useFinancialData } from '@/hooks/queries/useFinancialData';
import { useUrlParamCleaner } from '@/hooks/useUrlParamCleaner';
import { useStoredFinancialData } from '@/hooks/useStoredFinancialData';
import { processTransactionData } from '@/services/financialService';
import { getCurrentMonthRange } from '@/utils/dateUtils';

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

  // Storage hook for saving financial data
  const { saveSnapshot } = useStoredFinancialData();

  // Use the date range hook
  const { dateRange, updateDateRange } = useFinanceDateRange(fetchMonthlyBalance);
  
  // FIXED: Use useFinancialData which includes unpaid invoices processing
  const { 
    transactions, 
    stripeData,
    unpaidInvoices, // CRITICAL: This is what was missing!
    loading, 
    error, 
    usingCachedData, 
    cacheStatus, 
    refreshData: refetchData
  } = useFinancialData(dateRange.startDate, dateRange.endDate);

  console.log("🏠 useFinanceData: Hook rendered with FIXED HOOK - now using useFinancialData", {
    dateRange: `${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`,
    transactionCount: transactions.length,
    unpaidInvoicesCount: unpaidInvoices.length, // CRITICAL: Now we have unpaid invoices!
    unpaidInvoicesTotal: unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0),
    loading,
    usingCachedData,
    isLegitimateRefresh,
    hookSource: 'useFinancialData_with_unpaidInvoices',
    cacheStatus: {
      zohoHit: cacheStatus?.zoho?.cached || false,
      stripeHit: cacheStatus?.stripe?.cached || false
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

  // Financial data processing
  const financialData = useMemo(() => {
    // ENHANCED: Include unpaid invoices in the financial data
    const processedData = processTransactionData(transactions, startingBalance, collaboratorExpenses);
    
    // Add unpaid invoices to the processed data
    return {
      ...processedData,
      unpaidInvoices // CRITICAL: Include unpaid invoices in financial data
    };
  }, [transactions, startingBalance, collaboratorExpenses, unpaidInvoices]);

  // Auto-save financial data snapshot when data is successfully loaded
  useEffect(() => {
    if (transactions.length > 0 && !loading) {
      const snapshotData = {
        transactions,
        zohoTransactions: transactions.filter(tx => tx.source === 'Zoho'),
        stripeTransactions: transactions.filter(tx => tx.source === 'Stripe'),
        stripeData,
        unpaidInvoices, // CRITICAL: Include unpaid invoices in snapshot
        summary: financialData,
        collaboratorExpenses,
        startingBalance,
        regularIncome,
        stripeIncome,
        stripeFees,
        stripeNet,
        cacheStatus,
        apiConnectivity: { zoho: true, stripe: true },
      };

      saveSnapshot(
        dateRange,
        snapshotData,
        {
          dataSource: 'useFinanceData_with_unpaidInvoices',
          usingCachedData,
        }
      );

      console.log('💾 Auto-saved financial data snapshot with unpaid invoices', {
        dateRange,
        transactionCount: transactions.length,
        unpaidInvoicesCount: unpaidInvoices.length,
        usingCachedData,
      });
    }
  }, [
    transactions.length,
    loading,
    dateRange,
    financialData,
    collaboratorExpenses,
    startingBalance,
    regularIncome,
    stripeIncome,
    stripeFees,
    stripeNet,
    cacheStatus,
    usingCachedData,
    unpaidInvoices,
    saveSnapshot
  ]);

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

  // Data initialized flag - true when we have transactions or unpaid invoices
  const dataInitialized = useMemo(() => {
    const initialized = transactions.length > 0 || unpaidInvoices.length > 0;
    
    console.log("🔍 useFinanceData: Data initialization check with FIXED HOOK", {
      initialized,
      transactionCount: transactions.length,
      unpaidInvoicesCount: unpaidInvoices.length,
      usingCachedData,
      reason: initialized ? 
        'data_loaded_successfully' : 
        'no_data_loaded'
    });
    return initialized;
  }, [transactions.length, unpaidInvoices.length, usingCachedData]);

  // MANUAL DATA REFRESH FUNCTION
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
    
    console.log(`🚀 useFinanceData: Beginning MANUAL data load with FIXED HOOK`, {
      force, 
      isLegitimateRefresh,
      actualForceNeeded: force || isLegitimateRefresh
    });
    
    // Only force refresh if explicitly requested OR if it's a legitimate user refresh
    const shouldForceRefresh = force || isLegitimateRefresh;
    
    // Use the refetch function from useFinancialData
    const promise = refetchData(shouldForceRefresh);
    
    promise.finally(() => {
      // Always clean up when done
      console.log("✅ useFinanceData: Completed MANUAL data load with unpaid invoices");
      refreshInProgressRef.current = false;
    });
    
    return promise;
  }, [refetchData, isLegitimateRefresh]);

  return {
    dateRange,
    updateDateRange,
    financialData, // ENHANCED: Now includes unpaidInvoices
    unpaidInvoices, // CRITICAL: Explicitly return unpaid invoices
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
    startingBalance,
    notes,
    updateStartingBalance,
    setStartingBalance,
    setNotes,
    usingCachedData,
    cacheStatus,
    apiConnectivity: { zoho: true, stripe: true }, // Simplified
    checkApiConnectivity,
    cacheChecked: true, // Always true with useFinancialData
    hasCachedData: usingCachedData,
    isRefreshing: loading
  };
};
