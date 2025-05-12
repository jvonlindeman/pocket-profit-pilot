
import { useEffect } from 'react';
import { processTransactionData } from '@/services/zoho/utils';
import { useFinanceDateRange } from './finance/useFinanceDateRange';
import { useFinanceProcessing } from './finance/useFinanceProcessing';
import { useMonthlyBalanceOperations } from './finance/useMonthlyBalanceOperations';
import { useTransactionFetching } from './finance/useTransactionFetching';
import ZohoService from '@/services/zohoService';
import { format as formatDate } from 'date-fns';
import { useToast } from './use-toast';

export const useFinanceData = () => {
  const { toast } = useToast();
  
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
    opexAmount,
    itbmAmount,
    profitPercentage,
    fetchMonthlyBalance,
    updateStartingBalance,
    updateStripeOverride,
    updateSalaryCalculatorValues
  } = useMonthlyBalanceOperations();

  const {
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    salaryCalculation,
    processIncomeTypes,
    processCollaboratorData,
    calculateSalary
  } = useFinanceProcessing();

  const {
    transactions,
    loading,
    error,
    dataInitialized,
    rawResponse,
    usingCachedData,
    fetchData,
    refreshData,
    applyStripeOverride
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

  // Track last stripe override value to prevent duplicate toast notifications
  const lastStripeOverrideRef = React.useRef<number | null>(null);
  
  // Update stripe override with immediate processing refresh
  const updatedUpdateStripeOverride = async (override: number | null) => {
    console.log(`Updating Stripe override to: ${override}`);
    
    // Only proceed if the value is actually changing
    if (override !== lastStripeOverrideRef.current) {
      await updateStripeOverride(override, dateRange.startDate);
      
      // Apply the stripe override to transactions
      if (transactions.length > 0 && override !== null) {
        console.log(`Applying Stripe override: ${override} to transactions`);
        applyStripeOverride(override);
        
        // Show a toast to confirm the update
        toast({
          title: "Stripe manual override applied",
          description: `Stripe income set to $${override.toFixed(2)}`,
        });
        
        // Update the ref to prevent duplicate toasts
        lastStripeOverrideRef.current = override;
      }
      
      processIncomeTypes(transactions, override);
    }
  };

  // Update starting balance with fixed date argument
  const updatedUpdateStartingBalance = async (balance: number, notes?: string) => {
    await updateStartingBalance(balance, dateRange.startDate, notes);
    
    // Show a toast to confirm the update
    toast({
      title: "Balance inicial actualizado",
      description: `Nuevo balance: $${balance.toFixed(2)}`,
    });
  };
  
  // Update salary calculator values
  const updatedUpdateSalaryCalculatorValues = async (opex: number, itbm: number, profitPct: number) => {
    await updateSalaryCalculatorValues(opex, itbm, profitPct, dateRange.startDate);
    // Recalculate salary with new values
    calculateSalary(regularIncome, stripeIncome, opex, itbm, profitPct);
    
    // Show a toast to confirm the update
    toast({
      title: "Valores del calculador actualizados",
      description: `OPEX: $${opex.toFixed(2)}, ITBM: ${itbm.toFixed(2)}%, Beneficio: ${profitPct.toFixed(1)}%`,
    });
  };

  // Process income and collaborator data when transactions or stripeOverride change
  useEffect(() => {
    if (transactions.length > 0) {
      console.log(`Processing ${transactions.length} transactions with stripeOverride: ${stripeOverride}`);
      processIncomeTypes(transactions, stripeOverride);

      // If there's raw response data, process collaborator data
      if (rawResponse) {
        console.log("Processing collaborator data from raw response");
        processCollaboratorData(rawResponse);
      }
      
      // Apply stripe override to transactions when available, but don't show toast here
      // (toast is only shown when the value is explicitly changed by the user)
      if (stripeOverride !== null) {
        console.log(`Applying Stripe override: ${stripeOverride} to transactions`);
        applyStripeOverride(stripeOverride);
      }
    }
  }, [transactions, stripeOverride, processIncomeTypes, processCollaboratorData, rawResponse, applyStripeOverride]);
  
  // Calculate salary whenever income data or salary parameters change
  useEffect(() => {
    console.log(`Calculating salary with income: Regular=${regularIncome}, Stripe=${stripeIncome}`);
    console.log(`Parameters: OPEX=${opexAmount}, ITBM=${itbmAmount}%, Profit=${profitPercentage}%`);
    calculateSalary(regularIncome, stripeIncome, opexAmount, itbmAmount, profitPercentage);
  }, [regularIncome, stripeIncome, opexAmount, itbmAmount, profitPercentage, calculateSalary]);

  // Initialize the last stripe override ref with the current value
  useEffect(() => {
    lastStripeOverrideRef.current = stripeOverride;
  }, []);

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
    usingCachedData,
    // New salary calculator props
    opexAmount,
    itbmAmount,
    profitPercentage,
    salaryCalculation,
    updateSalaryCalculatorValues: updatedUpdateSalaryCalculatorValues
  };
};
