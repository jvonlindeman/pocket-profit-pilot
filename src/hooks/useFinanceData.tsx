import { useState, useEffect, useCallback } from 'react';
import ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { Transaction } from '@/types/financial';
import { processTransactionData } from '@/services/zoho/utils';
import { endOfMonth, subMonths, format as formatDate } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// Format date in YYYY-MM-DD format without timezone shifts
const formatDateYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fix date to ensure it's in the correct year
const fixDateYear = (date: Date): Date => {
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() > currentYear) {
    const correctedDate = new Date(date);
    correctedDate.setFullYear(currentYear);
    console.log(`useFinanceData: Corrected future date from ${date.toISOString()} to ${correctedDate.toISOString()}`);
    return correctedDate;
  }
  return date;
};

// Check if a date range is in the past (historical data)
const isHistoricalDateRange = (startDate: Date, endDate: Date): boolean => {
  const today = new Date();
  return endDate < today;
};

export const useFinanceData = () => {
  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);
  const [startingBalance, setStartingBalance] = useState<number | undefined>(undefined);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [partialRefresh, setPartialRefresh] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [stripeOverride, setStripeOverride] = useState<number | null>(null);
  
  // Estado del rango de fechas - configurado para mostrar desde el último día del mes anterior hasta el último día del mes actual
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Último día del mes anterior
    const startDate = endOfMonth(subMonths(today, 1));
    if (startDate.getFullYear() > currentYear) {
      startDate.setFullYear(currentYear);
    }
    
    // Último día del mes actual
    const endDate = endOfMonth(today);
    if (endDate.getFullYear() > currentYear) {
      endDate.setFullYear(currentYear);
    }
    
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Datos financieros procesados
  const financialData = processTransactionData(transactions, startingBalance);

  // Obtener el rango del mes actual
  const getCurrentMonthRange = useCallback(() => {
    const today = new Date();
    const currentYear = today.getFullYear(); // Get current year
    
    const startDate = new Date(currentYear, today.getMonth(), 1);
    const endDate = endOfMonth(today);
    
    // Ensure both dates are in the current year
    if (startDate.getFullYear() > currentYear) {
      startDate.setFullYear(currentYear);
    }
    
    if (endDate.getFullYear() > currentYear) {
      endDate.setFullYear(currentYear);
    }
    
    return { startDate, endDate };
  }, []);

  // Función para actualizar el rango de fechas
  const updateDateRange = useCallback((newRange: { startDate: Date; endDate: Date }) => {
    console.log("Date range updated:", newRange);
    
    // Fix any dates in the future year
    const startDate = fixDateYear(new Date(newRange.startDate));
    const endDate = fixDateYear(new Date(newRange.endDate));
    
    console.log("Corrected date values:", {
      startDate: startDate,
      endDate: endDate,
      startDateFormatted: formatDateYYYYMMDD(startDate),
      endDateFormatted: formatDateYYYYMMDD(endDate)
    });
    
    setDateRange({
      startDate,
      endDate
    });

    // Fetch monthly balance when date range changes
    fetchMonthlyBalance(startDate);
    
    // Check if we need to refresh the cache
    ZohoService.checkAndRefreshCache(startDate, endDate);
  }, []);

  // Fetch monthly balance for the selected month
  const fetchMonthlyBalance = useCallback(async (date: Date) => {
    try {
      // Ensure date is in current year
      date = fixDateYear(date);
      const monthYear = formatDate(date, 'yyyy-MM');
      
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error("Error fetching monthly balance:", error);
      }

      if (data) {
        console.log("Fetched monthly balance:", data);
        setStartingBalance(data.balance);
        setStripeOverride(data.stripe_override);
      } else {
        console.log("No monthly balance found for:", monthYear);
        setStartingBalance(undefined);
        setStripeOverride(null);
      }
    } catch (err) {
      console.error("Error in fetchMonthlyBalance:", err);
    }
  }, []);

  // Update the starting balance
  const updateStartingBalance = useCallback(async (balance: number, notes?: string) => {
    try {
      // Ensure date is in current year
      const correctedDate = fixDateYear(dateRange.startDate);
      const monthYear = formatDate(correctedDate, 'yyyy-MM');
      
      // Check if a record already exists
      const { data: existingData } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthYear)
        .single();
      
      if (existingData) {
        // Update existing record
        await supabase
          .from('monthly_balances')
          .update({
            balance,
            notes: notes || existingData.notes,
          })
          .eq('month_year', monthYear);
      } else {
        // Create new record
        await supabase
          .from('monthly_balances')
          .insert({
            month_year: monthYear,
            balance,
            notes: notes || null,
          });
      }
      
      setStartingBalance(balance);
    } catch (err) {
      console.error("Error updating starting balance:", err);
    }
  }, [dateRange.startDate]);

  // Función para procesar y separar ingresos
  const processIncomeTypes = useCallback((transactions: Transaction[]) => {
    let stripeAmount = 0;
    let regularAmount = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        if (transaction.source === 'Stripe') {
          stripeAmount += transaction.amount;
        } else {
          regularAmount += transaction.amount;
        }
      }
    });
    
    // If there's a stripe override for the current month, use it instead
    const effectiveStripeAmount = stripeOverride !== null ? stripeOverride : stripeAmount;
    
    setStripeIncome(effectiveStripeAmount);
    setRegularIncome(regularAmount);
    
    return { 
      stripeAmount: effectiveStripeAmount, 
      regularAmount 
    };
  }, [stripeOverride]);

  // Función para procesar datos de colaboradores
  const processCollaboratorData = useCallback((rawResponse: any) => {
    if (!rawResponse || !rawResponse.colaboradores || !Array.isArray(rawResponse.colaboradores)) {
      setCollaboratorExpenses([]);
      return [];
    }

    // Filtrar colaboradores con datos válidos
    const validCollaborators = rawResponse.colaboradores
      .filter((item: any) => item && typeof item.total !== 'undefined' && item.vendor_name)
      .map((item: any) => ({
        name: item.vendor_name,
        amount: Number(item.total)
      }))
      .filter((item: any) => item.amount > 0);

    // Calcular el total
    const totalAmount = validCollaborators.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    // Calcular porcentajes y formatear para el gráfico
    const formattedData = validCollaborators.map((item: any) => ({
      category: item.name,
      amount: item.amount,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    })).sort((a: any, b: any) => b.amount - a.amount);
    
    setCollaboratorExpenses(formattedData);
    return formattedData;
  }, []);

  // Check if a date range is historical (fully in the past)
  const isHistorical = useCallback((startDate: Date, endDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to start of day
    
    return endDate < today;
  }, []);

  // Parse cache statistics from API response
  const parseCacheStats = useCallback((response: any) => {
    if (!response) return null;
    
    let stats = null;
    
    // Check for different response formats that might contain cache stats
    if (response.cacheStats) {
      stats = response.cacheStats;
    } else if (response.partialRefresh) {
      stats = {
        partialRefresh: true,
        newCount: response.newTransactionsCount || 0,
        cachedCount: response.data?.length || 0
      };
    }
    
    // If we found stats, save them
    if (stats) {
      setCacheStats(stats);
    }
    
    return stats;
  }, []);
  
  // Función para cargar los datos (ahora no se carga automáticamente)
  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log("Fetching financial data...");
    setLoading(true);
    setError(null);
    setUsingCachedData(false);
    setPartialRefresh(false);
    setCacheStats(null);

    try {
      // Fix any dates in the future year
      const startDate = fixDateYear(new Date(dateRange.startDate));
      const endDate = fixDateYear(new Date(dateRange.endDate));
      
      // Also fetch the monthly balance for the selected date range
      await fetchMonthlyBalance(startDate);
      
      // Log exact date objects for debugging
      console.log("Original dateRange from datepicker:", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      console.log("Corrected dates:", {
        startDate,
        endDate,
        startDateFormatted: formatDateYYYYMMDD(startDate),
        endDateFormatted: formatDateYYYYMMDD(endDate)
      });
      
      // Check if we're loading historical data (past months)
      const loadingHistoricalData = isHistorical(startDate, endDate);
      
      // If we're looking at historical data and not forcing a refresh,
      // prefer using cached data even more strongly (higher chance of returning cache)
      const effectiveForceRefresh = loadingHistoricalData ? forceRefresh : forceRefresh;
      
      console.log(`Loading ${loadingHistoricalData ? 'historical' : 'current'} data, forceRefresh=${effectiveForceRefresh}`);
      
      // Before making any requests, clean up any future year dates if this is the first time loading
      if (!dataInitialized) {
        const cleanedCount = await ZohoService.cleanupFutureDates();
        if (cleanedCount > 0) {
          console.log(`useFinanceData: Cleaned up ${cleanedCount} transactions with future dates`);
        }
      }
      
      // Obtener transacciones de Zoho Books - usando las fechas corregidas
      const zohoData = await ZohoService.getTransactions(
        startDate, 
        endDate,
        effectiveForceRefresh // Use the adjusted forceRefresh value
      );

      // Obtener la respuesta cruda actual para depuración inmediatamente después
      const rawData = ZohoService.getLastRawResponse();
      setRawResponse(rawData);
      console.log("Fetched raw response for debugging:", rawData);
      
      // Check for partial refresh
      if (rawData && rawData.partialRefresh) {
        console.log("Detected partial refresh in response");
        setPartialRefresh(true);
      }
      
      // Parse cache stats if available
      parseCacheStats(rawData);

      // Detectar si estamos usando datos en caché basado en la respuesta
      if (rawData && (rawData.fromCache || rawData.cached)) {
        console.log("Using cached data from previous response");
        setUsingCachedData(true);
      }

      // Procesar datos de colaboradores
      processCollaboratorData(rawData);

      // Obtener transacciones de Stripe - usando las fechas corregidas
      console.log("Fetching from Stripe:", startDate, endDate);
      const stripeData = await StripeService.getTransactions(
        startDate,
        endDate
      );

      // Combinar los datos
      const combinedData = [...zohoData, ...stripeData];
      console.log("Combined transactions:", combinedData.length);
      
      // Procesar ingresos separados
      processIncomeTypes(combinedData);
      
      // Actualizar estado
      setTransactions(combinedData);
      setDataInitialized(true);
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(err.message || "Error al cargar los datos financieros");
      
      // Asegurarnos de obtener cualquier respuesta cruda para depuración incluso en caso de error
      const rawData = ZohoService.getLastRawResponse();
      if (rawData) {
        setRawResponse(rawData);
        console.log("Set raw response after error:", rawData);
      }
    } finally {
      setLoading(false);
    }
  }, [
    dateRange.startDate, 
    dateRange.endDate, 
    processIncomeTypes, 
    processCollaboratorData, 
    fetchMonthlyBalance,
    dataInitialized,
    isHistorical,
    parseCacheStats
  ]);

  // Función pública para refrescar datos (forzando o no)
  const refreshData = useCallback((force = false) => {
    fetchData(force);
  }, [fetchData]);

  return {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData,
    dataInitialized,
    rawResponse,
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    startingBalance,
    updateStartingBalance,
    usingCachedData,
    partialRefresh,
    cacheStats,
    stripeOverride
  };
};
