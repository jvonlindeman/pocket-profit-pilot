
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DateRange, FinancialData } from '@/types/financial';
import { RefreshStatus } from '@/types/finance-hooks';
import { formatISO, startOfMonth, endOfMonth } from 'date-fns';
import { DirectFetchService } from '@/services/directFetchService';
import { supabase } from '@/integrations/supabase/client';
import { emptyFinancialData } from '@/constants/financialDefaults';

// Helper to get the current month date range
const getCurrentMonthRange = (): DateRange => {
  const today = new Date();
  return {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  };
};

export const useSimplifiedFinanceData = () => {
  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>(getCurrentMonthRange());
  
  // State for financial data
  const [financialData, setFinancialData] = useState<FinancialData>(emptyFinancialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  
  // Additional data state
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [startingBalance, setStartingBalance] = useState<number | null>(null);
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);
  const [stripeOverride, setStripeOverride] = useState<any>(null);
  
  // Refresh status
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>({
    lastRefresh: new Date(),
    refreshAttempts: 0
  });

  // Refs for tracking component state
  const initialLoadAttemptedRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Function to update the date range
  const updateDateRange = useCallback((newRange: DateRange) => {
    console.log('Updating date range:', newRange);
    setDateRange(newRange);
  }, []);

  // Function to load stripe income data
  const loadStripeIncomeData = useCallback(async (currentDate: Date): Promise<{ amount: number, isOverridden: boolean }> => {
    try {
      // Format the month-year for the query
      const monthYear = formatISO(currentDate, { representation: 'date' }).substring(0, 7);
      
      // Query for any Stripe override in the monthly_balances table
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('stripe_override')
        .eq('month_year', monthYear)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching Stripe override:', error);
        return { amount: 0, isOverridden: false };
      }
      
      if (data && data.stripe_override !== null) {
        setStripeOverride({ amount: data.stripe_override, month_year: monthYear });
        return { amount: data.stripe_override, isOverridden: true };
      }
      
      // If no override, return 0
      setStripeOverride(null);
      return { amount: 0, isOverridden: false };
    } catch (err) {
      console.error('Error in loadStripeIncomeData:', err);
      return { amount: 0, isOverridden: false };
    }
  }, []);

  // Function to load monthly balance
  const loadMonthlyBalance = useCallback(async (currentDate: Date): Promise<number | null> => {
    try {
      // Format the month-year for the query
      const monthYear = formatISO(currentDate, { representation: 'date' }).substring(0, 7);
      
      // Query for the balance in the monthly_balances table
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('balance')
        .eq('month_year', monthYear)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching monthly balance:', error);
        return null;
      }
      
      if (data) {
        console.log('Loaded monthly balance data:', data);
        return data.balance;
      }
      
      return null;
    } catch (err) {
      console.error('Error in loadMonthlyBalance:', err);
      return null;
    }
  }, []);

  // Main function to fetch financial data
  const fetchFinancialData = useCallback(async (forceRefresh: boolean = false) => {
    if (loading) {
      console.log('Already loading, skipping duplicate request');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Increment refresh attempts
      setRefreshStatus(prev => ({
        lastRefresh: new Date(),
        refreshAttempts: prev.refreshAttempts + 1
      }));
      
      // Load any Stripe income override
      const stripeData = await loadStripeIncomeData(dateRange.startDate);
      
      // Load monthly balance
      const balance = await loadMonthlyBalance(dateRange.startDate);
      setStartingBalance(balance);
      
      // Fetch financial data directly
      const result = await DirectFetchService.fetchFinancialData(
        dateRange.startDate, 
        dateRange.endDate,
        balance || undefined
      );
      
      // Update the state with the fetched data
      setFinancialData(result.financialData);
      setRawResponse(result.rawResponse);
      
      // Extract Stripe income and collaborator expenses from the raw response
      const extractedStripeIncome = stripeData.isOverridden ? stripeData.amount : DirectFetchService.extractStripeIncome(result.rawResponse);
      setStripeIncome(extractedStripeIncome);
      
      // Extract collaborator expenses
      const expenses = DirectFetchService.extractCollaboratorExpenses(result.rawResponse);
      setCollaboratorExpenses(expenses);
      
      // Calculate regular income (total income minus stripe income)
      const totalIncome = result.financialData.summary.totalIncome;
      const calculatedRegularIncome = totalIncome - extractedStripeIncome;
      setRegularIncome(calculatedRegularIncome);
      
      // Mark data as initialized
      setDataInitialized(true);
      initialLoadAttemptedRef.current = true;
      
      // Success message
      toast({
        title: "Datos actualizados",
        description: "Los datos financieros se han cargado correctamente",
      });
      
      return result.financialData;
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Error desconocido al cargar datos',
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [dateRange, loadStripeIncomeData, loadMonthlyBalance, toast]);

  // Load data when date range changes and data is already initialized
  useEffect(() => {
    if (dataInitialized) {
      console.log('Date range changed, refreshing data:', { dateRange });
      fetchFinancialData();
    }
  }, [dateRange, dataInitialized, fetchFinancialData]);

  // Create a helper function for stripe data chart
  const getStripeDataForChart = useCallback(() => {
    return { 
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
      values: [0, 0, 0, 0, stripeIncome || 0, 0] 
    };
  }, [stripeIncome]);

  // Reset error state
  const resetErrorState = useCallback(() => {
    setError(null);
  }, []);

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
    
    // Income data
    stripeIncome,
    regularIncome,
    stripeOverride,
    
    // Balance data
    startingBalance,
    
    // Expenses data
    collaboratorExpenses,
    
    // Debug information
    rawResponse,
    
    // Functions
    fetchFinancialData,
    resetErrorState,
    
    // Status information
    initialLoadAttempted: initialLoadAttemptedRef.current,
    
    // Data chart helper
    getStripeDataForChart,
    
    // Refresh status
    refreshStatus,
    
    // Update functions
    setFinancialData
  };
};
