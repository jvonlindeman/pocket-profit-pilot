
import { useState, useCallback } from 'react';
import { DateRange, FinancialData, CacheStats } from '@/types/financial';
import { CacheStatus } from '@/types/cache';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ZohoService from '@/services/zohoService';
import { safeParseNumber } from '@/utils/financialUtils';
import { formatDateForAPI } from '@/lib/date-utils';

// Default financial data structure
export const DEFAULT_FINANCIAL_DATA: FinancialData = {
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    collaboratorExpense: 0,
    otherExpense: 0,
    profit: 0,
    profitMargin: 0,
  },
  transactions: [],
  incomeBySource: [],
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

// Create a timeout promise for API calls
const timeoutPromise = (ms: number) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
});

export const useFinanceDataFetcher = () => {
  const [financialData, setFinancialData] = useState<FinancialData>(DEFAULT_FINANCIAL_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    usingCachedData: false,
    partialRefresh: false,
    stats: null,
    lastRefresh: null
  });
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Fetch financial data from the API or cache
  const fetchFinancialData = useCallback(async (
    dateRange: DateRange, 
    forceRefresh: boolean = false,
    stripeIncomeData: { amount: number, isOverridden: boolean }
  ) => {
    console.log(`📊 Fetching financial data with forceRefresh=${forceRefresh}`);
    setLoading(true);
    setError(null);
    setCacheStatus({
      usingCachedData: false,
      partialRefresh: false,
      stats: null,
      lastRefresh: new Date()
    });

    try {
      // Format dates for API call
      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);
      
      console.log('📆 Formatted dates for API call:', formattedStartDate, formattedEndDate);
      
      // Prepare params for API call
      const params = new URLSearchParams({
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        force_refresh: forceRefresh ? 'true' : 'false'
      });
      
      // Fetch data from API with timeout
      let data;
      let apiError = null;
      
      try {
        // Try using Supabase function invoke with timeout
        console.log(`🔄 Invoking zoho-transactions function with params:`, {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          forceRefresh: forceRefresh
        });
        
        // Create a promise that will race against a timeout
        const invokePromise = supabase.functions.invoke("zoho-transactions", {
          body: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            forceRefresh: forceRefresh
          }
        });
        
        // Race the invoke promise with a timeout
        const result = await Promise.race([
          invokePromise,
          timeoutPromise(15000) // 15 seconds timeout
        ]) as any;
        
        if (result.error) {
          throw new Error(`Error al invocar la función zoho-transactions: ${result.error.message || JSON.stringify(result.error)}`);
        }
        
        data = result.data;
        
        if (!data) {
          throw new Error("No se recibieron datos de la función zoho-transactions");
        }
        
        console.log("✅ Data received from zoho-transactions function:", data);
      } catch (invokeError: any) {
        console.error("❌ Error calling zoho-transactions function:", invokeError);
        apiError = invokeError;
        
        // Fallback to direct fetch
        try {
          console.log("⚠️ Falling back to direct fetch method");
          const fetchPromise = fetch(`/functions/v1/zoho-transactions?${params.toString()}`);
          
          // Race the fetch promise with a timeout
          const response = await Promise.race([
            fetchPromise,
            timeoutPromise(15000) // 15 seconds timeout
          ]) as Response;
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Check for JSON content type
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error("⚠️ Received non-JSON response:", textResponse.substring(0, 200) + "...");
            throw new Error(`Respuesta no JSON recibida del servidor: ${response.status} ${response.statusText}`);
          }
          
          data = await response.json();
          console.log("✅ Data received from direct API call:", data);
        } catch (fetchError) {
          console.error("❌ Error with direct fetch call:", fetchError);
          throw apiError || new Error("Error al obtener datos financieros");
        }
      }
      
      // Store raw response for debugging
      setRawResponse(data);
      
      // Update cache status information
      if (data.cache_status) {
        setCacheStatus({
          usingCachedData: data.cache_status.using_cached_data || false,
          partialRefresh: data.cache_status.partial_refresh || false,
          stats: data.cache_status.stats ? {
            cachedCount: data.cache_status.stats.cached_count || 0,
            newCount: data.cache_status.stats.new_count || 0,
            totalCount: data.cache_status.stats.total_count || 0
          } : null,
          lastRefresh: new Date()
        });
      }
      
      // Process the financial data
      if (data.financial_data) {
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
        
        // Update state with processed data
        setFinancialData(updatedData);
        
        // Extract collaborator expenses if available
        if (data.collaborator_expenses && Array.isArray(data.collaborator_expenses)) {
          setCollaboratorExpenses(data.collaborator_expenses);
          console.log('👥 Collaborator expenses:', data.collaborator_expenses);
        }

        toast({
          title: "Datos financieros actualizados",
          description: `Ingresos: $${totalIncome.toFixed(2)}, Gastos: $${totalExpense.toFixed(2)}`,
        });
        
        // Mark data as initialized
        setDataInitialized(true);
        return updatedData;
      } else {
        console.warn('⚠️ No financial_data found in the response:', data);
        return DEFAULT_FINANCIAL_DATA;
      }
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
  }, [toast]);

  // Clear cache and force refresh data
  const clearCacheAndRefresh = useCallback(async (dateRange: DateRange) => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear the cache for the current date range
      console.log('🗑️ Clearing cache for date range:', dateRange);
      const success = await ZohoService.clearCacheForDateRange(dateRange.startDate, dateRange.endDate);
      
      if (success) {
        toast({
          title: "Caché limpiado con éxito",
          description: "Se va a obtener datos frescos de la API",
        });
        console.log('✅ Cache cleared successfully');
      } else {
        throw new Error("No se pudo limpiar el caché");
      }
      
      return true;
    } catch (err: any) {
      console.error("❌ Error clearing cache:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al limpiar el caché");
      toast({
        variant: "destructive",
        title: "Error al limpiar el caché",
        description: err instanceof Error ? err.message : "Error desconocido al limpiar el caché",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
