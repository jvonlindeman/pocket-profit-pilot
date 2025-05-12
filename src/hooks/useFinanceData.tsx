
import { useEffect } from 'react';
import { processTransactionData } from '@/services/zoho/utils';
import { useFinanceDateRange } from './finance/useFinanceDateRange';
import { useFinanceProcessing } from './finance/useFinanceProcessing';
import { useMonthlyBalanceOperations } from './finance/useMonthlyBalanceOperations';
import { useTransactionFetching } from './finance/useTransactionFetching';
import ZohoService from '@/services/zohoService';
import { format as formatDate } from 'date-fns';

export const useFinanceData = () => {
  // Use our custom hooks to organize functionality
  const {
    dateRange,
    updateDateRange,
    getCurrentMonthRange,
    formatDateYYYYMMDD
  } = useFinanceDateRange();

  const {
    startingBalance,
    stripeOverride,
    fetchMonthlyBalance,
    updateStartingBalance,
    updateStripeOverride
  } = useMonthlyBalanceOperations();

  const {
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    processIncomeTypes,
    processCollaboratorData
  } = useFinanceProcessing();

  const {
    transactions,
    loading,
    error,
    dataInitialized,
    rawResponse,
    usingCachedData,
    fetchData,
    refreshData
  } = useTransactionFetching(dateRange, formatDateYYYYMMDD, fetchMonthlyBalance);

  // Process financial data with the latest state values
  const financialData = processTransactionData(transactions, startingBalance, stripeOverride);

  // Update the date range with data refresh
  const updatedUpdateDateRange = (newRange: { startDate: Date; endDate: Date }) => {
    updateDateRange(newRange);
    
    // Fetch monthly balance when date range changes
    fetchMonthlyBalance(newRange.startDate);
    
    // Check if we need to refresh the cache
    ZohoService.checkAndRefreshCache(newRange.startDate, newRange.endDate);
  };

  // Update stripe override with immediate processing refresh
  const updatedUpdateStripeOverride = async (override: number | null) => {
    await updateStripeOverride(override, dateRange.startDate);
    processIncomeTypes(transactions, override);
  };

  // Update starting balance with fixed date argument
  const updatedUpdateStartingBalance = async (balance: number, notes?: string) => {
    await updateStartingBalance(balance, dateRange.startDate, notes);
  };

  // Process income and collaborator data when transactions or stripeOverride change
  useEffect(() => {
    if (transactions.length > 0) {
      processIncomeTypes(transactions, stripeOverride);

      // If there's raw response data, process collaborator data
      if (rawResponse) {
        processCollaboratorData(rawResponse);
      }
    }
  }, [transactions, stripeOverride, processIncomeTypes, processCollaboratorData, rawResponse]);

  return {
    dateRange,
    updateDateRange: updatedUpdateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData,
    dataInitialized,
    rawResponse,
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    startingBalance,
    updateStartingBalance: updatedUpdateStartingBalance,
    stripeOverride,
    updateStripeOverride: updatedUpdateStripeOverride,
    usingCachedData
  };
};
