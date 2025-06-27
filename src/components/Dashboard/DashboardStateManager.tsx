
import { useState, useMemo } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { UnpaidInvoice } from '@/types/financial';
import { getCurrentMonthRange } from '@/utils/dateUtils';

export const useDashboardStateManager = () => {
  console.log("🏠 DashboardStateManager: Initializing with enhanced error handling...");
  
  // Add error state for better error tracking
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  try {
    // PASSIVE MODE: useFinanceData no longer auto-loads data
    const {
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
      updateStartingBalance,
      setStartingBalance,
      usingCachedData,
      cacheStatus,
      cacheChecked,
      hasCachedData,
      isRefreshing
    } = useFinanceData();
    
    const [showBalanceDialog, setShowBalanceDialog] = useState(false);
    
    // SAFE DATE HANDLING: Ensure we always have a valid date range
    const safeCurrentMonthDate = useMemo(() => {
      try {
        if (!dateRange?.startDate || isNaN(dateRange.startDate.getTime())) {
          console.warn("🏠 DashboardStateManager: Invalid dateRange.startDate, using current date");
          return new Date();
        }
        return dateRange.startDate;
      } catch (err) {
        console.error("🏠 DashboardStateManager: Error processing date range, using fallback:", err);
        return new Date();
      }
    }, [dateRange?.startDate]);
    
    console.log("🏠 DashboardStateManager: Safe current month date:", safeCurrentMonthDate);
    
    // ENHANCED MONTHLY BALANCE: Add error handling
    const monthlyBalanceResult = useMonthlyBalance({ 
      currentDate: safeCurrentMonthDate
    });
    
    // Extract monthly balance data with fallbacks
    const { 
      checkBalanceExists, 
      monthlyBalance, 
      updateMonthlyBalance,
      loading: monthlyBalanceLoading,
      error: monthlyBalanceError
    } = monthlyBalanceResult;
    
    // SAFE DATE RANGE MANAGER: Add error handling
    const dateRangeManager = useDateRangeManager({
      dateRange: dateRange || getCurrentMonthRange(),
      updateDateRange,
      getCurrentMonthRange
    });
    
    const { handleDateRangeChange, getDatePickerCurrentMonthRange } = dateRangeManager;
    
    const { createPeriodTitle } = useDateFormatter();
    
    // SAFE PERIOD TITLE: Add defensive checks
    const periodTitle = useMemo(() => {
      try {
        if (!dateRange?.startDate || !dateRange?.endDate) {
          console.warn("🏠 DashboardStateManager: Missing date range for period title");
          return 'Sin fecha seleccionada';
        }
        
        if (isNaN(dateRange.startDate.getTime()) || isNaN(dateRange.endDate.getTime())) {
          console.warn("🏠 DashboardStateManager: Invalid dates in date range");
          return 'Fechas inválidas';
        }
        
        return createPeriodTitle(dateRange.startDate, dateRange.endDate);
      } catch (err) {
        console.error("🏠 DashboardStateManager: Error creating period title:", err);
        return 'Error en el título del período';
      }
    }, [createPeriodTitle, dateRange?.startDate, dateRange?.endDate]);

    // SAFE ZOHO EXPENSES: Add defensive checks
    const totalZohoExpenses = useMemo(() => {
      try {
        if (!financialData?.transactions || !Array.isArray(financialData.transactions)) {
          return 0;
        }
        return financialData.transactions
          .filter(tx => tx && tx.type === 'expense' && tx.source !== 'Stripe')
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      } catch (err) {
        console.error("🏠 DashboardStateManager: Error calculating Zoho expenses:", err);
        return 0;
      }
    }, [financialData?.transactions]);

    // Enhanced debugging and improved value extraction logic
    console.log("💼 DashboardStateManager: Monthly balance data received:", monthlyBalance);
    
    // IMMEDIATE VALUES: Use the most current values with better defaults
    const opexAmount = monthlyBalance?.opex_amount ?? 35;
    const itbmAmount = monthlyBalance?.itbm_amount ?? 0;
    const profitPercentage = monthlyBalance?.profit_percentage ?? 1;
    const taxReservePercentage = monthlyBalance?.tax_reserve_percentage ?? 5;
    const includeZohoFiftyPercent = monthlyBalance?.include_zoho_fifty_percent ?? true;
    
    console.log("💼 DashboardStateManager: IMMEDIATE VALUES for calculator:", { 
      opexAmount, 
      itbmAmount, 
      profitPercentage, 
      taxReservePercentage,
      includeZohoFiftyPercent,
      startingBalance,
      monthlyBalanceId: monthlyBalance?.id,
      monthlyBalanceTimestamp: monthlyBalance?.updated_at,
      isRefreshing,
      timestamp: new Date().toISOString()
    });
    
    // REACTIVE KEY: Forces complete re-render when ANY value changes
    const calculatorKey = `calculator-${monthlyBalance?.id || 'default'}-${monthlyBalance?.updated_at || Date.now()}-${startingBalance}-${opexAmount}-${itbmAmount}-${profitPercentage}-${taxReservePercentage}-${includeZohoFiftyPercent}`;
    
    console.log("💼 DashboardStateManager: Calculator key (forces re-render):", calculatorKey);
    console.log("💼 DashboardStateManager: Transaction count:", financialData?.transactions?.length || 0);
    console.log("💼 DashboardStateManager: Is refreshing:", isRefreshing);
    console.log("💼 DashboardStateManager: Include Zoho 50%:", includeZohoFiftyPercent);

    // SAFE RETURN: Ensure all required data is available
    return {
      // Data state - with safe fallbacks
      dateRange: dateRange || getCurrentMonthRange(),
      financialData: financialData || { 
        summary: { 
          totalIncome: 0, totalExpense: 0, collaboratorExpense: 0, 
          otherExpense: 0, profit: 0, profitMargin: 0, grossProfit: 0, grossProfitMargin: 0 
        }, 
        transactions: [], 
        expenseByCategory: [] 
      },
      loading: loading || monthlyBalanceLoading,
      error: error || monthlyBalanceError || initializationError,
      dataInitialized,
      rawResponse,
      usingCachedData,
      cacheStatus,
      cacheChecked,
      hasCachedData,
      isRefreshing,
      
      // Financial data - with safe fallbacks
      stripeIncome: stripeIncome || 0,
      stripeFees: stripeFees || 0,
      stripeTransactionFees: stripeTransactionFees || 0,
      stripePayoutFees: stripePayoutFees || 0,
      stripeAdditionalFees: stripeAdditionalFees || 0,
      stripeNet: stripeNet || 0,
      stripeFeePercentage: stripeFeePercentage || 0,
      regularIncome: regularIncome || 0,
      collaboratorExpenses: collaboratorExpenses || [],
      unpaidInvoices: unpaidInvoices || [],
      startingBalance: startingBalance || 0,
      totalZohoExpenses,
      
      // Derived values - with safe fallbacks
      periodTitle,
      currentMonthDate: safeCurrentMonthDate,
      calculatorKey,
      opexAmount,
      itbmAmount,
      profitPercentage,
      taxReservePercentage,
      includeZohoFiftyPercent,
      
      // Monthly balance
      monthlyBalance,
      checkBalanceExists,
      updateMonthlyBalance,
      setStartingBalance,
      
      // UI state
      showBalanceDialog,
      setShowBalanceDialog,
      
      // Functions - with safe fallbacks
      refreshData: refreshData || (() => Promise.resolve(false)),
      handleDateRangeChange: handleDateRangeChange || (() => {}),
      getDatePickerCurrentMonthRange: getDatePickerCurrentMonthRange || (() => ({ from: new Date(), to: new Date() })),
    };
    
  } catch (err) {
    console.error("🚨 DashboardStateManager: Critical initialization error:", err);
    setInitializationError(err instanceof Error ? err.message : 'Unknown initialization error');
    
    // Return safe fallback state
    const fallbackDateRange = getCurrentMonthRange();
    return {
      dateRange: fallbackDateRange,
      financialData: { 
        summary: { 
          totalIncome: 0, totalExpense: 0, collaboratorExpense: 0, 
          otherExpense: 0, profit: 0, profitMargin: 0, grossProfit: 0, grossProfitMargin: 0 
        }, 
        transactions: [], 
        expenseByCategory: [] 
      },
      loading: false,
      error: `Initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      dataInitialized: false,
      rawResponse: null,
      usingCachedData: false,
      cacheStatus: { zoho: { hit: false, partial: false }, stripe: { hit: false, partial: false } },
      cacheChecked: false,
      hasCachedData: false,
      isRefreshing: false,
      stripeIncome: 0,
      stripeFees: 0,
      stripeTransactionFees: 0,
      stripePayoutFees: 0,
      stripeAdditionalFees: 0,
      stripeNet: 0,
      stripeFeePercentage: 0,
      regularIncome: 0,
      collaboratorExpenses: [],
      unpaidInvoices: [],
      startingBalance: 0,
      totalZohoExpenses: 0,
      periodTitle: 'Error de inicialización',
      currentMonthDate: new Date(),
      calculatorKey: 'error-fallback',
      opexAmount: 35,
      itbmAmount: 0,
      profitPercentage: 1,
      taxReservePercentage: 5,
      includeZohoFiftyPercent: true,
      monthlyBalance: null,
      checkBalanceExists: async () => false,
      updateMonthlyBalance: async () => false,
      setStartingBalance: () => {},
      showBalanceDialog: false,
      setShowBalanceDialog: () => {},
      refreshData: async () => false,
      handleDateRangeChange: () => {},
      getDatePickerCurrentMonthRange: () => ({ from: new Date(), to: new Date() }),
    };
  }
};
