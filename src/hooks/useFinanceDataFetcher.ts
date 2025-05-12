
import { useCallback, useRef } from 'react';
import { DateRange, FinancialData } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';
import { emptyFinancialData } from '@/constants/financialDefaults';
import { useFinanceAPI } from '@/hooks/useFinanceAPI';
import { transformFinancialData } from '@/utils/financeDataTransformer';
import { retryWithBackoff } from '@/utils/apiUtils';
import { useFinanceDataState } from '@/hooks/useFinanceDataState';
import { useFinanceErrorHandler } from '@/hooks/useFinanceErrorHandler';

export const useFinanceDataFetcher = () => {
  const { toast } = useToast();
  const { fetchFinanceDataFromAPI } = useFinanceAPI();

  // Use our hooks for state management and error handling
  const {
    financialData,
    setFinancialData,
    loading,
    setLoading,
    dataInitialized,
    setDataInitialized,
    rawResponse,
    setRawResponse,
    regularIncome,
    setRegularIncome,
    collaboratorExpenses,
    setCollaboratorExpenses
  } = useFinanceDataState();
  
  const {
    error,
    setError,
    resetErrorState,
    localRefreshingRef
  } = useFinanceErrorHandler();

  // Fetch financial data from the API
  const fetchFinancialData = useCallback(async (
    dateRange: DateRange, 
    stripeIncomeData: { amount: number, isOverridden: boolean },
    startingBalanceData?: { starting_balance: number },
    forceRefresh: boolean = true 
  ) => {
    // Check if we're already refreshing
    if (localRefreshingRef.current) {
      console.warn("⚠️ Fetch operation already in progress, skipping duplicate request");
      return null;
    }
    
    // Set local refresh flag
    localRefreshingRef.current = true;
    
    console.log(`📊 Fetching financial data with forceRefresh=${forceRefresh}, startingBalance=${startingBalanceData?.starting_balance}`);
    setLoading(true);
    setError(null);
    
    try {
      // Always fetch fresh data from API
      const data = await retryWithBackoff(
        () => fetchFinanceDataFromAPI(dateRange, true, startingBalanceData),
        1,
        1000
      );
      
      // Store raw response for debugging
      console.log("📑 Setting raw response data:", data);
      setRawResponse(data);
      
      // Ensure the starting balance is included in the data
      const dataWithBalance = startingBalanceData 
        ? { ...data, starting_balance: startingBalanceData.starting_balance } 
        : data;
      
      // Process the financial data using the transformer
      const { financialData: processedData } = transformFinancialData(dataWithBalance, stripeIncomeData);
      
      // Extract and set collaborator expenses if available
      if (data.collaborator_expenses && Array.isArray(data.collaborator_expenses)) {
        setCollaboratorExpenses(data.collaborator_expenses);
        console.log('👥 Collaborator expenses:', data.collaborator_expenses);
      }
      
      // Extract and set regular income
      const regularIncomeValue = processedData.transactions
        ?.filter((tx: any) => tx.type === 'income' && tx.source === 'Zoho')
        .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0) || 0;
      
      setRegularIncome(regularIncomeValue);
      
      // Update state with processed data
      console.log("🔄 Setting financial data:", processedData);
      setFinancialData(processedData);
      
      toast({
        title: "Datos financieros actualizados",
        description: `Ingresos: $${processedData.summary.totalIncome.toFixed(2)}, Gastos: $${processedData.summary.totalExpense.toFixed(2)}`,
      });
      
      // Mark data as initialized
      setDataInitialized(true);
      return processedData;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al obtener datos";
      console.error("❌ Error fetching financial data:", err);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error al obtener datos",
        description: errorMessage,
      });
      return null;
    } finally {
      setLoading(false);
      // Reset local refresh flag
      localRefreshingRef.current = false;
    }
  }, [
    fetchFinanceDataFromAPI,
    toast,
    setFinancialData,
    setLoading,
    setError,
    setRawResponse,
    setCollaboratorExpenses,
    setRegularIncome,
    setDataInitialized,
    localRefreshingRef
  ]);

  return {
    financialData,
    loading,
    error,
    dataInitialized,
    setDataInitialized,
    rawResponse,
    regularIncome,
    collaboratorExpenses,
    fetchFinancialData,
    resetErrorState,
    isRefreshing: localRefreshingRef.current,
    setFinancialData,
  };
};
