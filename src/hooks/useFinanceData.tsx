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
import { smartDataFetcherService } from '@/services/smartDataFetcherService';

export const useFinanceData = () => {
  // Keep track of the last time refreshData was called
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const refreshRequestIdRef = useRef<string>('');
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  
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

  // CENTRALIZED DATA REFRESH FUNCTION - Now using Smart Strategy
  // This function will handle all data refresh requests and ensure only one is processed at a time
  const refreshData = useCallback((force = false) => {
    // Generate a unique request ID for this refresh
    const requestId = `refresh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // If a refresh is already in progress, return the existing promise
    if (refreshInProgressRef.current) {
      console.log(`Finance data refresh already in progress, reusing existing promise (${requestId})`);
      return refreshPromiseRef.current || Promise.resolve(false);
    }
    
    // If this is a new refresh request within the cooldown period and not forced, throttle it
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < 10000 && !force) { // 10 second cooldown
      console.log(`Throttling refresh request, last refresh was ${timeSinceLastRefresh}ms ago`);
      return Promise.resolve(false);
    }
    
    // Set flags to indicate refresh in progress
    refreshInProgressRef.current = true;
    refreshRequestIdRef.current = requestId;
    lastRefreshTimeRef.current = now;
    
    console.log(`Beginning intelligent data refresh (ID: ${requestId}, force: ${force})`);
    
    // Create the promise using the smart data fetcher
    const promise = (async () => {
      try {
        // Use the smart data fetcher service
        const result = await smartDataFetcherService.fetchAllFinancialData(
          dateRange,
          force,
          {
            onTransactions: (transactions) => {
              // This will be handled by the enhanced data fetcher
            },
            onCollaboratorData: processCollaboratorData,
            onIncomeTypes: processIncomeTypes
          }
        );

        console.log(`Smart fetch completed (ID: ${requestId})`, {
          success: result.success,
          totalTransactions: result.totalTransactions,
          cacheEfficiency: Math.round(result.cacheEfficiency * 100) + '%',
          apiCallsSaved: result.apiCallsSaved
        });

        // Use the enhanced data fetcher for actual data processing
        const fetchFunction = getRefreshFunction(force);
        return await fetchFunction(dateRange, force, {
          onCollaboratorData: processCollaboratorData,
          onIncomeTypes: processIncomeTypes
        });

      } catch (error) {
        console.error(`Smart fetch failed (ID: ${requestId}):`, error);
        throw error;
      }
    })();

    promise.finally(() => {
      // Always clean up when done
      console.log(`Completed data refresh (ID: ${requestId})`);
      refreshInProgressRef.current = false;
      refreshPromiseRef.current = null;
    });
    
    // Store the promise for reuse if another request comes in while this is processing
    refreshPromiseRef.current = promise;
    return promise;
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
