
import { useState, useCallback } from 'react';
import { DateRange, FinancialData } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_FINANCIAL_DATA } from '@/constants/financialDefaults';
import { useFinanceAPI } from '@/hooks/useFinanceAPI';
import { useCacheManagement } from '@/hooks/useCacheManagement';
import { transformFinancialData } from '@/utils/financeDataTransformer';

export const useFinanceDataFetcher = () => {
  const [financialData, setFinancialData] = useState<FinancialData>(DEFAULT_FINANCIAL_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { fetchFinanceDataFromAPI } = useFinanceAPI();
  const { cacheStatus, updateCacheStatus, clearCacheForDateRange } = useCacheManagement();

  // Fetch financial data from the API or cache
  const fetchFinancialData = useCallback(async (
    dateRange: DateRange, 
    forceRefresh: boolean = false,
    stripeIncomeData: { amount: number, isOverridden: boolean },
    startingBalanceData?: { starting_balance: number }
  ) => {
    console.log(`📊 Fetching financial data with forceRefresh=${forceRefresh}, startingBalance=${startingBalanceData?.starting_balance}`);
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data from API, passing the starting balance if available
      const data = await fetchFinanceDataFromAPI(dateRange, forceRefresh, startingBalanceData);
      
      // Store raw response for debugging
      console.log("📑 Setting raw response data:", data);
      setRawResponse(data);
      
      // Ensure the starting balance is included in the data
      const dataWithBalance = startingBalanceData 
        ? { ...data, starting_balance: startingBalanceData.starting_balance } 
        : data;
      
      // Update cache status information
      if (dataWithBalance.cache_status) {
        updateCacheStatus(dataWithBalance.cache_status);
      }
      
      // Process the financial data using the transformer
      const processedData = transformFinancialData(dataWithBalance, stripeIncomeData, updateCacheStatus);
      
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
      console.error("❌ Error fetching financial data:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al obtener datos");
      toast({
        variant: "destructive",
        title: "Error al obtener datos",
        description: err instanceof Error ? err.message : "Error desconocido al obtener datos",
      });
      return DEFAULT_FINANCIAL_DATA;
    } finally {
      setLoading(false);
    }
  }, [fetchFinanceDataFromAPI, updateCacheStatus, toast]);

  // Clear cache and force refresh data
  const clearCacheAndRefresh = useCallback(async (dateRange: DateRange) => {
    setLoading(true);
    setError(null);
    
    try {
      return await clearCacheForDateRange(dateRange);
    } finally {
      setLoading(false);
    }
  }, [clearCacheForDateRange]);

  return {
    financialData,
    setFinancialData,
    loading,
    error,
    dataInitialized,
    setDataInitialized,
    rawResponse,
    regularIncome,
    collaboratorExpenses,
    cacheStatus,
    fetchFinancialData,
    clearCacheAndRefresh,
  };
};
