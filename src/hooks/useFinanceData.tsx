
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/types/financial';
import { useDateRange } from '@/hooks/useDateRange';
import { useStripeIncome } from '@/hooks/useStripeIncome';
import { useFinanceDataFetcher } from '@/hooks/useFinanceDataFetcher';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';

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
    clearCacheAndRefresh
  } = dataFetcher;

  // Main function to fetch and process financial data
  const refreshData = useCallback(async (forceRefresh: boolean = false) => {
    try {
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
      
      // Pass starting balance if available
      const startingBalanceData = startingBalance !== undefined && startingBalance !== null 
        ? { starting_balance: startingBalance } 
        : {};
        
      console.log('💰 Passing starting balance to API:', startingBalanceData);
      
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
        toast({
          title: "Datos cargados",
          description: "Datos financieros actualizados correctamente",
        });
        return true;
      } else {
        console.error("❌ Failed to load financial data - result was null/undefined");
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: "No se pudieron cargar los datos financieros",
        });
        return false;
      }
    } catch (err) {
      console.error("🚨 Error in refreshData:", err);
      toast({
        variant: "destructive",
        title: "Error de carga",
        description: err instanceof Error ? err.message : "Error desconocido al cargar datos",
      });
      return false;
    }
  }, [dateRange, isDateInRange, loadStripeIncomeData, fetchFinancialData, setDataInitialized, toast, setStripeIncome, startingBalance]);

  // Clear cache and refresh data
  const handleClearCacheAndRefresh = useCallback(async () => {
    console.log('🗑️ Clearing cache and refreshing data...');
    toast({
      title: "Limpiando caché",
      description: "Eliminando datos en caché y obteniendo datos frescos...",
    });
    
    try {
      const success = await clearCacheAndRefresh(dateRange);
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
  }, [dateRange, clearCacheAndRefresh, refreshData, toast]);

  // Update data when date range changes or when starting balance changes
  useEffect(() => {
    if (dataInitialized) {
      console.log('📅 Date range or starting balance changed, refreshing data:', { dateRange, startingBalance });
      refreshData(false);
    }
  }, [dateRange, startingBalance, dataInitialized, refreshData]);

  useEffect(() => {
    console.log('🔍 Finance data component mounted or data initialized state changed:', { dataInitialized });
  }, [dataInitialized]);

  // If the financialData doesn't have the starting balance but we have one from the monthly balance,
  // update the financial data summary
  useEffect(() => {
    if (financialData && startingBalance !== undefined && 
        (financialData.summary.startingBalance === undefined || 
         financialData.summary.startingBalance !== startingBalance)) {
      console.log('📊 Updating financial data with starting balance:', startingBalance);
      dataFetcher.setFinancialData({
        ...financialData,
        summary: {
          ...financialData.summary,
          startingBalance: startingBalance
        }
      });
    }
  }, [financialData, startingBalance, dataFetcher]);

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
  };
};
