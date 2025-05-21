
import { useMemo, useCallback } from 'react';
import { useFinanceDateRange } from '@/hooks/useFinanceDateRange';
import { useEnhancedFinancialDataFetcher } from '@/hooks/useEnhancedFinancialDataFetcher';
import { useFinancialPersistence } from '@/hooks/useFinancialPersistence';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalanceManager } from '@/hooks/useMonthlyBalanceManager';
import { financialService } from '@/services/financialService';
import { getCurrentMonthRange } from '@/utils/dateUtils';

export const useFinanceData = () => {
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

  // Financial data processing
  const financialData = useMemo(() => {
    // Pass collaboratorExpenses to ensure they're included in the summary
    return financialService.processTransactionData(transactions, startingBalance, collaboratorExpenses);
  }, [transactions, startingBalance, collaboratorExpenses]);

  // Save financial summary when data changes
  useMemo(() => {
    saveFinancialData(financialData, dateRange, transactions.length, loading);
  }, [financialData, dateRange, transactions.length, loading, saveFinancialData]);

  // Function to refresh data with the callbacks prepared
  const refreshData = useCallback((force = false) => {
    const fetchFunction = getRefreshFunction(force);
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
