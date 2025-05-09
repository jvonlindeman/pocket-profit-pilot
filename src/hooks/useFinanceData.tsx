
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/types/financial';
import { useDateRange } from '@/hooks/useDateRange';
import { useStripeIncome } from '@/hooks/useStripeIncome';
import { useFinanceDataFetcher } from '@/hooks/useFinanceDataFetcher';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useRefreshManager } from '@/hooks/useRefreshManager';
import { useBalanceSync } from '@/hooks/useBalanceSync';

export const useFinanceData = () => {
  // Use our custom hooks for specific functionality
  const dateRangeHook = useDateRange();
  const { dateRange, updateDateRange, getCurrentMonthRange, isDateInRange } = dateRangeHook;
  
  const { toast } = useToast();
  
  const stripeHook = useStripeIncome();
  const { stripeIncome, stripeOverride, loadStripeIncomeData, setStripeIncome } = stripeHook;
  
  const monthlyBalanceHook = useMonthlyBalance({ currentDate: dateRange.startDate });
  const { balance: startingBalance } = monthlyBalanceHook;
  
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
    clearCacheAndRefresh: clearCacheFromDataFetcher,
    setFinancialData,
  } = dataFetcher;
  
  // Use our new utilities
  const refreshManager = useRefreshManager();
  const { isRefreshing, refreshCount, withRefreshProtection, resetCircuitBreaker } = refreshManager;
  
  const { syncBalance } = useBalanceSync();
  
  // Track data initialization to prevent attempting to refresh before ready
  const wasInitializedRef = useRef<boolean>(false);
  // Track current data range to avoid unnecessary refreshes
  const currentDateRangeRef = useRef<DateRange | null>(null);

  // Reset refresh count when component mounts or date range changes
  useEffect(() => {
    // Only reset counters if the date range has actually changed
    if (!currentDateRangeRef.current || 
        currentDateRangeRef.current.startDate !== dateRange.startDate || 
        currentDateRangeRef.current.endDate !== dateRange.endDate) {
      console.log('🔄 Date range changed, resetting refresh count');
      resetCircuitBreaker();
      // Update current date range ref
      currentDateRangeRef.current = { ...dateRange };
    }
  }, [dateRange, resetCircuitBreaker]);
  
  // Main function to fetch and process financial data
  const refreshData = useCallback(async (forceRefresh: boolean = false) => {
    return await withRefreshProtection(async () => {
      console.log('🔄 Starting data refresh with forceRefresh =', forceRefresh);
      toast({
        title: "Cargando datos",
        description: `${forceRefresh ? 'Forzando actualización' : 'Actualizando'} datos financieros...`,
      });
      
      // First load Stripe income data
      console.log('📊 Loading Stripe income data...');
      const stripeData = await loadStripeIncomeData(dateRange, isDateInRange);
      console.log('💰 Loaded Stripe income data:', stripeData);
      
      // Set the Stripe income value after loading to ensure it's available
      if (stripeData) {
        setStripeIncome(stripeData.amount || 0);
      }
      
      // Prepare starting balance data, only if we have a valid value
      let startingBalanceData = undefined;
      if (startingBalance !== undefined && startingBalance !== null) {
        startingBalanceData = { starting_balance: startingBalance };
        console.log('💰 Passing starting balance to API:', startingBalanceData);
      } else {
        console.log('💰 No starting balance to pass to API');
      }
      
      // Then fetch the main financial data including Stripe
      console.log('📈 Fetching financial data with stripe data and starting balance:', {
        stripeData,
        startingBalanceData
      });
      
      const result = await fetchFinancialData(
        dateRange, 
        forceRefresh, 
        {
          amount: stripeData?.amount || 0,
          isOverridden: stripeData?.isOverridden || false
        },
        startingBalanceData
      );
      
      if (result) {
        console.log('✅ Financial data loaded successfully:', result);
        setDataInitialized(true);
        wasInitializedRef.current = true;
        
        toast({
          title: "Datos cargados",
          description: "Datos financieros actualizados correctamente",
        });
        return true;
      } else {
        console.error("❌ Failed to load financial data - result was falsy");
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: "No se pudieron cargar los datos financieros",
        });
        return false;
      }
    }, forceRefresh);
  }, [
    dateRange, 
    isDateInRange, 
    loadStripeIncomeData, 
    fetchFinancialData, 
    setDataInitialized, 
    toast, 
    setStripeIncome, 
    startingBalance, 
    withRefreshProtection
  ]);

  // Clear cache and refresh data
  const handleClearCacheAndRefresh = useCallback(async () => {
    return await withRefreshProtection(async () => {
      console.log('🗑️ Clearing cache and refreshing data...');
      toast({
        title: "Limpiando caché",
        description: "Eliminando datos en caché y obteniendo datos frescos...",
      });
      
      try {
        const success = await clearCacheFromDataFetcher(dateRange);
        if (success) {
          console.log('✅ Cache cleared successfully');
          // Force refresh the data after clearing cache
          return await refreshData(true);
        } else {
          console.error('❌ Failed to clear cache');
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo limpiar el caché",
          });
          return false;
        }
      } catch (err) {
        console.error('🚨 Error clearing cache:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Error desconocido al limpiar caché",
        });
        return false;
      }
    }, true);
  }, [dateRange, clearCacheFromDataFetcher, refreshData, toast, withRefreshProtection]);

  // Manual refresh function that resets circuit breaker and forces refresh
  const forceManualRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh requested, resetting circuit breaker...');
    resetCircuitBreaker();
    return await refreshData(true);
  }, [refreshData, resetCircuitBreaker]);

  // Update data when date range changes - removed startingBalance from dependencies!
  useEffect(() => {
    if (dataInitialized) {
      console.log('📅 Date range changed, refreshing data:', { dateRange });
      refreshData(false);
    }
  }, [dateRange, dataInitialized, refreshData]);

  // Separate effect for debugging initialization state
  useEffect(() => {
    console.log('🔍 Finance data component mounted or data initialized state changed:', { dataInitialized });
    
    // Initial data load if not already initialized
    if (dataInitialized && !wasInitializedRef.current) {
      console.log('🚀 Data initialized but wasInitializedRef is false, setting to true');
      wasInitializedRef.current = true;
    }
  }, [dataInitialized]);

  // Completely separate effect for handling startingBalance changes
  useEffect(() => {
    syncBalance(startingBalance, financialData, setFinancialData, dataInitialized);
  }, [startingBalance, financialData, setFinancialData, dataInitialized]);

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
    setDataInitialized,
    
    // Income data
    stripeIncome,
    regularIncome,
    stripeOverride,
    
    // Balance data
    startingBalance,
    
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
    forceManualRefresh,
    
    // Status information
    isRefreshing,
    refreshCount
  };
};
