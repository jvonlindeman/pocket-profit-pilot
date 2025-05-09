
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from '@/types/financial';
import { useDateRange } from '@/hooks/useDateRange';
import { useStripeIncome } from '@/hooks/useStripeIncome';
import { useFinanceDataFetcher } from '@/hooks/useFinanceDataFetcher';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';

// Maximum number of refreshes to prevent runaway loops
const MAX_REFRESHES_PER_SESSION = 3;
// Minimum time between refreshes in milliseconds
const MIN_REFRESH_INTERVAL = 10000; // 10 seconds

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
    resetCircuitBreaker,
    setFinancialData,
    isRefreshing
  } = dataFetcher;
  
  // Add a ref to track if the balance has been synced to avoid infinite loops
  const balanceSyncedRef = useRef<number | null>(null);
  // Add a ref to track if we're in a refresh operation to prevent cascading updates
  const isRefreshingRef = useRef<boolean>(false);
  // Track last refresh time to prevent too frequent refreshes
  const lastRefreshTimeRef = useRef<number>(0);
  // Track number of refreshes to prevent runaway loops
  const refreshCountRef = useRef<number>(0);
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
      refreshCountRef.current = 0;
      // Reset the last refresh time when date range changes
      lastRefreshTimeRef.current = 0;
      // Update current date range ref
      currentDateRangeRef.current = { ...dateRange };
      
      // Also reset the global circuit breaker
      resetCircuitBreaker();
    }
  }, [dateRange, resetCircuitBreaker]);
  
  // Main function to fetch and process financial data
  const refreshData = useCallback(async (forceRefresh: boolean = false) => {
    // Check if we're already refreshing from any source
    if (isRefreshing || isRefreshingRef.current) {
      console.log('🔄 Already refreshing data, skipping duplicate refresh');
      return false;
    }
    
    // Check if we've hit the maximum number of refreshes
    if (refreshCountRef.current >= MAX_REFRESHES_PER_SESSION && !forceRefresh) {
      const message = `⚠️ Maximum refresh count (${MAX_REFRESHES_PER_SESSION}) reached, preventing potential infinite loop`;
      console.warn(message);
      toast({
        title: "Límite de refrescos alcanzado",
        description: "Para evitar bucles infinitos, se ha limitado el número de refrescos automáticos. Use el botón de refrescar manual.",
        variant: "destructive"
      });
      return false;
    }
    
    // Check if it's too soon for another refresh
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (!forceRefresh && lastRefreshTimeRef.current > 0 && timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      console.log(`⏱️ Too soon for another refresh. Last refresh was ${timeSinceLastRefresh}ms ago. Min interval is ${MIN_REFRESH_INTERVAL}ms`);
      return false;
    }
    
    // Increment refresh count and update last refresh time
    refreshCountRef.current++;
    lastRefreshTimeRef.current = now;
    
    isRefreshingRef.current = true;
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
      
      // Prepare starting balance data, only if we have a valid value
      // IMPORTANT: Get startingBalance from ref to avoid circular dependency
      const currentBalance = startingBalance;
      let startingBalanceData = undefined;
      if (currentBalance !== undefined && currentBalance !== null) {
        startingBalanceData = { starting_balance: currentBalance };
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
        
        // When data loads successfully, update our balance sync ref to prevent unnecessary updates
        if (currentBalance !== undefined && currentBalance !== null) {
          balanceSyncedRef.current = currentBalance;
        }
        
        toast({
          title: "Datos cargados",
          description: "Datos financieros actualizados correctamente",
        });
        return true;
      } else if (result === null) {
        // This is a special case where fetchFinancialData returns null due to circuit breaker
        console.log("ℹ️ Fetch operation skipped by circuit breaker");
        return false;
      } else {
        console.error("❌ Failed to load financial data - result was falsy");
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
    } finally {
      isRefreshingRef.current = false;
    }
  }, [dateRange, isDateInRange, loadStripeIncomeData, fetchFinancialData, setDataInitialized, toast, setStripeIncome, startingBalance, isRefreshing]);

  // Clear cache and refresh data
  const handleClearCacheAndRefresh = useCallback(async () => {
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
  }, [dateRange, clearCacheFromDataFetcher, refreshData, toast]);

  // Manual refresh function that resets circuit breaker and forces refresh
  const forceManualRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh requested, resetting circuit breaker...');
    
    // Reset all counters and flags
    refreshCountRef.current = 0;
    lastRefreshTimeRef.current = 0;
    isRefreshingRef.current = false;
    resetCircuitBreaker();
    
    // Force a refresh
    return await refreshData(true);
  }, [refreshData, resetCircuitBreaker]);

  // Update data when date range changes - REMOVED startingBalance from dependencies!
  useEffect(() => {
    if (dataInitialized) {
      console.log('📅 Date range changed, refreshing data:', { dateRange });
      refreshData(false);
    }
  }, [dateRange, dataInitialized, refreshData]); // startingBalance removed from dependencies

  // Separate effect for debugging initialization state
  useEffect(() => {
    console.log('🔍 Finance data component mounted or data initialized state changed:', { dataInitialized });
    
    // Initial data load if not already initialized
    if (dataInitialized && !wasInitializedRef.current) {
      console.log('🚀 Data initialized but wasInitializedRef is false, setting to true');
      wasInitializedRef.current = true;
    }
  }, [dataInitialized]);

  // Completely separate effect for handling startingBalance changes - with better debouncing
  useEffect(() => {
    // Skip this effect during component initialization or if data isn't loaded yet
    if (!dataInitialized || !financialData) {
      console.log('💡 Skipping balance effect - data not initialized or financial data not loaded yet');
      return;
    }

    // Get the current financial data balance for comparison
    const currentFinancialDataBalance = financialData.summary.startingBalance;
    
    // Only proceed if we have both financialData and a valid startingBalance
    if (startingBalance !== undefined && startingBalance !== null) {
      // Check if the balance is different from what's in financialData AND from our last synced value
      const needsUpdate = (currentFinancialDataBalance === undefined || 
                          currentFinancialDataBalance !== startingBalance) &&
                          balanceSyncedRef.current !== startingBalance;
      
      if (needsUpdate) {
        console.log('📊 Updating financial data with starting balance:', startingBalance, 
                   'previous sync value was:', balanceSyncedRef.current);
        
        // Update our ref to indicate we've synced this specific balance value
        balanceSyncedRef.current = startingBalance;
        
        // Update the financial data with the new balance without triggering a full refresh
        setFinancialData({
          ...financialData,
          summary: {
            ...financialData.summary,
            startingBalance: startingBalance
          }
        });
      } else {
        console.log('📊 No need to update financial data with starting balance - already synced or unchanged');
      }
    }
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
    isRefreshing: isRefreshing || isRefreshingRef.current,
    refreshCount: refreshCountRef.current
  };
};
