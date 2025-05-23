
import { useMemo, useCallback, useRef } from 'react';
import { useFinanceDateRange } from '@/hooks/useFinanceDateRange';
import { useEnhancedFinancialDataFetcher } from '@/hooks/useEnhancedFinancialDataFetcher';
import { useFinancialPersistence } from '@/hooks/useFinancialPersistence';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalanceManager } from '@/hooks/useMonthlyBalanceManager';
import { financialService, processTransactionData } from '@/services/financialService';
import { getCurrentMonthRange } from '@/utils/dateUtils';
import { zohoRepository } from '@/repositories/zohoRepository';
import { UnpaidInvoice } from '@/types/financial';
import { apiRequestManager } from '@/utils/ApiRequestManager';

export const useFinanceData = () => {
  // Keep track of the last time refreshData was called
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const refreshRequestIdRef = useRef<string>('');
  
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
  
  // Use the enhanced data fetcher hook
  const { 
    transactions, 
    dataInitialized, 
    loading, 
    error, 
    rawResponse, 
    usingCachedData, 
    cacheStatus, 
    apiConnectivity, 
    checkApiConnectivity, 
    fetchData, 
    refreshData: getRefreshFunction 
  } = useEnhancedFinancialDataFetcher();

  // Use the financial persistence hook
  const { saveFinancialData } = useFinancialPersistence();

  // Get unpaid invoices from zoho repository
  const unpaidInvoices = useMemo<UnpaidInvoice[]>(() => {
    return zohoRepository.getUnpaidInvoices();
  }, [transactions]);

  // Financial data processing
  const financialData = useMemo(() => {
    // Pass collaboratorExpenses to ensure they're included in the summary
    return processTransactionData(transactions, startingBalance, collaboratorExpenses);
  }, [transactions, startingBalance, collaboratorExpenses]);

  // Save financial summary when data changes
  useMemo(() => {
    if (financialData && dateRange && !loading) {
      saveFinancialData(financialData, dateRange, transactions.length, loading);
    }
  }, [financialData, dateRange, transactions.length, loading, saveFinancialData]);

  // Function to refresh data with strict deduplication
  const refreshData = useCallback((force = false) => {
    // Generate a unique request ID for this refresh
    const requestId = `refresh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Skip if we're already refreshing and this isn't a forced refresh
    if (refreshInProgressRef.current && !force) {
      console.log(`Skip refresh, already in progress (${requestId})`);
      return Promise.resolve(false);
    }
    
    // Generate a cache key for this specific refresh operation
    const refreshCacheKey = `finance-refresh-${dateRange.startDate?.getTime()}-${dateRange.endDate?.getTime()}-${force}`;
    
    // If force refresh, clear the cache entry
    if (force) {
      apiRequestManager.clearCacheEntry(refreshCacheKey);
    }
    
    // Use the ApiRequestManager to deduplicate refresh requests
    return apiRequestManager.executeRequest(
      refreshCacheKey,
      async () => {
        try {
          // Set flags to indicate refresh in progress
          refreshInProgressRef.current = true;
          refreshRequestIdRef.current = requestId;
          lastRefreshTimeRef.current = Date.now();
          
          // Get the actual fetch function
          const fetchFunction = getRefreshFunction(force);
          
          // Execute the fetch with dates and callbacks
          const result = await fetchFunction(dateRange, force, {
            onCollaboratorData: processCollaboratorData,
            onIncomeTypes: processIncomeTypes
          });
          
          return result;
        } finally {
          // Always clean up when done
          refreshInProgressRef.current = false;
        }
      },
      0,  // No caching, always execute the function
      force ? 0 : 5000  // Cooldown of 5 seconds unless forced
    );
  }, [dateRange, getRefreshFunction, processCollaboratorData, processIncomeTypes]);

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
    unpaidInvoices,
    startingBalance,
    notes,
    updateStartingBalance,
    setStartingBalance,
    setNotes,
    usingCachedData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity
  };
};
