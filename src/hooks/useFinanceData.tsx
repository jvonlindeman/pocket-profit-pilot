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

export const useFinanceData = () => {
  // Keep track of the last time refreshData was called
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshCooldownRef = useRef<number>(2000); // 2 second cooldown
  
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

  // Function to refresh data with the callbacks prepared and cooldown protection
  const refreshData = useCallback((force = false) => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    // Skip if within cooldown period and not a forced refresh
    if (timeSinceLastRefresh < refreshCooldownRef.current && !force) {
      console.log(`Skipping refresh, last refresh was ${timeSinceLastRefresh}ms ago (cooldown: ${refreshCooldownRef.current}ms)`);
      return Promise.resolve(false);
    }
    
    // Update last refresh time
    lastRefreshTimeRef.current = now;
    
    // Get the fetch function with cooldown protection applied
    const fetchFunction = getRefreshFunction(force);
    
    // Return a function that will call the fetchFunction with the appropriate parameters
    return fetchFunction(dateRange, force, {
      onCollaboratorData: processCollaboratorData,
      onIncomeTypes: processIncomeTypes
    });
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
