
import { useCallback } from 'react';
import { DateRange } from '@/types/financial';

/**
 * Hook to manage data loading operations without circuit breaker functionality
 */
export const useDataLoading = () => {
  // Main function to fetch and process financial data
  const loadFinancialData = useCallback(async (
    dateRange: DateRange,
    isDateInRange: (date: string) => boolean,
    loadStripeIncome: (dateRange: DateRange, isDateInRange: (date: string) => boolean) => Promise<any>,
    setStripeIncome: (value: number) => void,
    fetchFinancialData: (
      dateRange: DateRange, 
      stripeIncomeData: { amount: number, isOverridden: boolean },
      startingBalanceData?: { starting_balance: number },
      forceRefresh?: boolean
    ) => Promise<any>,
    startingBalance: number | null | undefined,
    withRefreshProtection: (operation: () => Promise<any>, forceRefresh?: boolean) => Promise<any>,
    setDataInitialized: (value: boolean) => void,
    toast: any,
    forceRefresh: boolean = false
  ) => {
    return await withRefreshProtection(async () => {
      console.log('🔄 Starting data refresh with forceRefresh =', forceRefresh);
      toast({
        title: "Cargando datos",
        description: `${forceRefresh ? 'Forzando actualización' : 'Actualizando'} datos financieros...`,
      });
      
      // First load Stripe income data
      console.log('📊 Loading Stripe income data...');
      const stripeData = await loadStripeIncome(dateRange, isDateInRange);
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
      
      try {
        const result = await fetchFinancialData(
          dateRange, 
          {
            amount: stripeData?.amount || 0,
            isOverridden: stripeData?.isOverridden || false
          },
          startingBalanceData,
          forceRefresh
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
          console.error("❌ Failed to load financial data - result was falsy");
          toast({
            variant: "destructive",
            title: "Error de carga",
            description: "No se pudieron cargar los datos financieros",
          });
          return false;
        }
      } catch (error) {
        console.error("❌ Error in refreshData:", error);
        // We don't need to show a toast here because fetchFinancialData already shows one
        return false;
      }
    }, forceRefresh);
  }, []);

  return { loadFinancialData };
};
