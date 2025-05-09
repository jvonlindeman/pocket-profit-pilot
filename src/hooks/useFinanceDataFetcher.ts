
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
          startingBalance: data.starting_balance || data.summary?.startingBalance || DEFAULT_FINANCIAL_DATA.summary.startingBalance
        },
        transactions,
        incomeBySource: [], // Add this to match the expected structure
        expenseByCategory: [],
        dailyData: {
          income: { labels: [], values: [] },
          expense: { labels: [], values: [] }
        },
        monthlyData: {
          income: { labels: [], values: [] },
          expense: { labels: [], values: [] },
          profit: { labels: [], values: [] }
        }
      };
      
      // Process transactions into daily and monthly data
      // Group transactions by date for daily data
      const transactionsByDate = new Map();
      transactions.forEach((tx: any) => {
        const date = tx.date;
        if (!transactionsByDate.has(date)) {
          transactionsByDate.set(date, { income: 0, expense: 0 });
        }
        if (tx.type === 'income') {
          transactionsByDate.get(date).income += safeParseNumber(tx.amount || 0);
        } else {
          transactionsByDate.get(date).expense += safeParseNumber(tx.amount || 0);
        }
      });
      
      // Sort dates and create daily chart data
      const sortedDates = Array.from(transactionsByDate.keys()).sort();
      transformedData.dailyData = {
        income: { 
          labels: sortedDates, 
          values: sortedDates.map(date => transactionsByDate.get(date)?.income || 0) 
        },
        expense: { 
          labels: sortedDates, 
          values: sortedDates.map(date => transactionsByDate.get(date)?.expense || 0) 
        }
      };
      
      // Group transactions by month for monthly data
      const transactionsByMonth = new Map();
      transactions.forEach((tx: any) => {
        // Extract month-year from date (YYYY-MM)
        const monthYear = tx.date.substring(0, 7);
        if (!transactionsByMonth.has(monthYear)) {
          transactionsByMonth.set(monthYear, { income: 0, expense: 0 });
        }
        if (tx.type === 'income') {
          transactionsByMonth.get(monthYear).income += safeParseNumber(tx.amount || 0);
        } else {
          transactionsByMonth.get(monthYear).expense += safeParseNumber(tx.amount || 0);
        }
      });
      
      // Sort months and create monthly chart data
      const sortedMonths = Array.from(transactionsByMonth.keys()).sort();
      const monthlyLabels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return `${monthNum}/${year.substr(2)}`;
      });
      
      const monthlyIncomeValues = sortedMonths.map(month => transactionsByMonth.get(month)?.income || 0);
      const monthlyExpenseValues = sortedMonths.map(month => transactionsByMonth.get(month)?.expense || 0);
      const monthlyProfitValues = sortedMonths.map((month, i) => 
        (transactionsByMonth.get(month)?.income || 0) - (transactionsByMonth.get(month)?.expense || 0)
      );
      
      transformedData.monthlyData = {
        income: { labels: monthlyLabels, values: monthlyIncomeValues },
        expense: { labels: monthlyLabels, values: monthlyExpenseValues },
        profit: { labels: monthlyLabels, values: monthlyProfitValues }
      };
      
      // Process expense by category
      const expensesByCategory = new Map();
      expenseTransactions.forEach((tx: any) => {
        const category = tx.category || 'Sin categoría';
        if (!expensesByCategory.has(category)) {
          expensesByCategory.set(category, 0);
        }
        expensesByCategory.set(category, expensesByCategory.get(category) + safeParseNumber(tx.amount || 0));
      });
      
      transformedData.expenseByCategory = Array.from(expensesByCategory.entries())
        .map(([category, amount]) => ({ 
          category, 
          amount: safeParseNumber(amount) 
        }))
        .sort((a, b) => b.amount - a.amount);
      
      console.log("🔄 Created transformed financial data structure:", transformedData);
      
      // Preserve cache status information from the API response
      if (data.fromCache || data.cached || data.partialRefresh) {
        updateCacheStatus({
          usingCachedData: Boolean(data.fromCache || data.cached),
          partialRefresh: Boolean(data.partialRefresh),
          stats: data.cacheStats || data.newTransactionsCount 
            ? { 
                cachedCount: data.cacheStats?.cachedCount || 0,
                newCount: data.newTransactionsCount || 0,
                isFresh: data.cacheStats?.isFresh || false
              } 
            : null
        });
      }
      
      return transformedData;
    }
    
    if (!data.financial_data) {
      console.warn('⚠️ No financial_data found in the response and unable to transform:', data);
      // Return default data with a properly structured summary including Stripe income
      const defaultData = JSON.parse(JSON.stringify(DEFAULT_FINANCIAL_DATA)); // Deep clone to avoid mutations
      const stripeAmount = safeParseNumber(stripeIncomeData.amount || 0);
      defaultData.summary.totalIncome = stripeAmount;
      defaultData.summary.profit = stripeAmount;
      defaultData.summary.profitMargin = 100; // If only income, no expenses
      
      // Preserve cache status information from the API response
      if (data.fromCache || data.cached || data.partialRefresh) {
        updateCacheStatus({
          usingCachedData: Boolean(data.fromCache || data.cached),
          partialRefresh: Boolean(data.partialRefresh),
          stats: data.cacheStats || null
        });
      }
      
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
        // Make sure starting balance is preserved
        startingBalance: data.financial_data.summary.startingBalance || data.starting_balance || DEFAULT_FINANCIAL_DATA.summary.startingBalance
      },
      // Ensure all required structure exists
      incomeBySource: data.financial_data.incomeBySource || [],
      expenseByCategory: data.financial_data.expenseByCategory || [],
      dailyData: data.financial_data.dailyData || {
        income: { labels: [], values: [] },
        expense: { labels: [], values: [] }
      },
      monthlyData: data.financial_data.monthlyData || {
        income: { labels: [], values: [] },
        expense: { labels: [], values: [] },
        profit: { labels: [], values: [] }
      }
    };
    
    // Extract collaborator expenses if available
    if (data.collaborator_expenses && Array.isArray(data.collaborator_expenses)) {
      setCollaboratorExpenses(data.collaborator_expenses);
      console.log('👥 Collaborator expenses:', data.collaborator_expenses);
    }
    
    // Preserve cache status information from the API response
    if (data.fromCache || data.cached || data.partialRefresh) {
      updateCacheStatus({
        usingCachedData: Boolean(data.fromCache || data.cached),
        partialRefresh: Boolean(data.partialRefresh),
        stats: data.cacheStats || null
      });
    }
    
    return updatedData;
  }, [updateCacheStatus]);

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
