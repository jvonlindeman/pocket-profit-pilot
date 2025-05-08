
import { useState, useCallback } from 'react';
import { DateRange, FinancialData } from '@/types/financial';
import { useToast } from '@/hooks/use-toast';
import { safeParseNumber } from '@/utils/financialUtils';
import { DEFAULT_FINANCIAL_DATA } from '@/constants/financialDefaults';
import { useFinanceAPI } from '@/hooks/useFinanceAPI';
import { useCacheManagement } from '@/hooks/useCacheManagement';

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

  // Process the financial data received from the API
  const processFinancialData = useCallback((data: any, stripeIncomeData: { amount: number, isOverridden: boolean }) => {
    // Store raw response for debugging
    setRawResponse(data);
    
    // Check if we have the expected data format or if we need to transform it
    if (!data.financial_data && data.cached_transactions) {
      console.log('🔄 Transforming cached_transactions to financial_data format');
      
      // Create the structure that the application expects
      const transactions = data.cached_transactions || [];
      
      // Calculate basic summary data
      const incomeTransactions = transactions.filter((tx: any) => tx.type === 'income');
      const expenseTransactions = transactions.filter((tx: any) => tx.type === 'expense');
      
      // Store regular income from Zoho (excluding Stripe)
      const zohoIncomeTransactions = incomeTransactions.filter((tx: any) => tx.source === 'Zoho');
      const regularIncomeValue = zohoIncomeTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0);
      setRegularIncome(regularIncomeValue);
      console.log('💰 Regular income from Zoho:', regularIncomeValue);
      
      // Extract collaborator expenses
      const collaboratorTransactions = expenseTransactions.filter((tx: any) => tx.category === 'Pagos a colaboradores');
      setCollaboratorExpenses(collaboratorTransactions);
      console.log('👥 Collaborator expenses:', collaboratorTransactions);
      
      // Calculate total income including Stripe
      const stripeAmount = safeParseNumber(stripeIncomeData.amount || 0);
      console.log('💳 Stripe amount:', stripeAmount);
      
      const totalIncome = regularIncomeValue + stripeAmount;
      console.log('💵 Total income (Zoho + Stripe):', totalIncome);
      
      const totalExpense = expenseTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0);
      const profit = totalIncome - totalExpense;
      const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
      
      console.log("📊 Financial summary calculation:", {
        regularIncome: regularIncomeValue,
        stripeIncome: stripeAmount,
        totalIncome,
        totalExpense,
        profit,
        profitMargin
      });
      
      // Create the financial_data structure that the app expects
      const transformedData = {
        summary: {
          totalIncome,
          totalExpense,
          profit,
          profitMargin,
          collaboratorExpense: collaboratorTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0),
          otherExpense: totalExpense - collaboratorTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0),
        },
        transactions,
        dailyData: {
          income: { labels: [], values: [] },
          expense: { labels: [], values: [] }
        },
        monthlyData: {
          labels: [],
          income: [],
          expense: [],
          profit: []
        },
        expenseByCategory: []
      };
      
      // Process transactions into daily and monthly data and expense categories
      // This would need more complex processing but for now we're building a minimal structure
      
      console.log("🔄 Created transformed financial data structure:", transformedData);
      return transformedData;
    }
    
    if (!data.financial_data) {
      console.warn('⚠️ No financial_data found in the response and unable to transform:', data);
      // Return default data with a properly structured summary including Stripe income
      const defaultData = DEFAULT_FINANCIAL_DATA;
      const stripeAmount = safeParseNumber(stripeIncomeData.amount || 0);
      defaultData.summary.totalIncome = stripeAmount;
      defaultData.summary.profit = stripeAmount;
      defaultData.summary.profitMargin = 100; // If only income, no expenses
      return defaultData;
    }
    
    // If we have the expected data.financial_data structure, process it normally
    // Store regular income from Zoho
    const regularIncomeValue = safeParseNumber(data.financial_data.summary.totalIncome || 0);
    setRegularIncome(regularIncomeValue);
    console.log('💰 Regular income from Zoho:', regularIncomeValue);
    
    // Calculate total income including Stripe
    const stripeAmount = safeParseNumber(stripeIncomeData.amount || 0);
    console.log('💳 Stripe amount:', stripeAmount);
    
    const totalIncome = regularIncomeValue + stripeAmount;
    console.log('💵 Total income (Zoho + Stripe):', totalIncome);
    
    const totalExpense = safeParseNumber(data.financial_data.summary.totalExpense || 0);
    const profit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    
    console.log("📊 Financial summary calculation:", {
      regularIncome: regularIncomeValue,
      stripeIncome: stripeAmount,
      totalIncome,
      totalExpense,
      profit,
      profitMargin
    });
    
    // Update summary with calculated values
    const updatedData = {
      ...data.financial_data,
      summary: {
        ...data.financial_data.summary,
        totalIncome: totalIncome,
        profit: profit,
        profitMargin: profitMargin,
      }
    };
    
    // Extract collaborator expenses if available
    if (data.collaborator_expenses && Array.isArray(data.collaborator_expenses)) {
      setCollaboratorExpenses(data.collaborator_expenses);
      console.log('👥 Collaborator expenses:', data.collaborator_expenses);
    }
    
    return updatedData;
  }, []);

  // Fetch financial data from the API or cache
  const fetchFinancialData = useCallback(async (
    dateRange: DateRange, 
    forceRefresh: boolean = false,
    stripeIncomeData: { amount: number, isOverridden: boolean }
  ) => {
    console.log(`📊 Fetching financial data with forceRefresh=${forceRefresh}`);
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data from API
      const data = await fetchFinanceDataFromAPI(dateRange, forceRefresh);
      
      // Store raw response for debugging
      console.log("📑 Setting raw response data:", data);
      setRawResponse(data);
      
      // Update cache status information
      if (data.cache_status) {
        updateCacheStatus(data.cache_status);
      }
      
      // Process the financial data - now handles both data structures
      const processedData = processFinancialData(data, stripeIncomeData);
      
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
  }, [fetchFinanceDataFromAPI, updateCacheStatus, processFinancialData, toast]);

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
