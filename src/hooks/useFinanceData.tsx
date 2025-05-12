
import { useState, useEffect, useCallback } from 'react';
import ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { Transaction } from '@/types/financial';
import { processTransactionData } from '@/services/zoho/utils';
import { endOfMonth, subMonths, format as formatDate } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Estado del rango de fechas - configurado para mostrar desde el último día del mes anterior hasta el último día del mes actual
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Último día del mes anterior
    const startDate = endOfMonth(subMonths(today, 1));
    // Último día del mes actual
    const endDate = endOfMonth(today);
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Datos financieros procesados
  const financialData = processTransactionData(transactions, startingBalance);

  // Function to format date in YYYY-MM-DD format without timezone shifts
  const formatDateYYYYMMDD = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Obtener el rango del mes actual
  const getCurrentMonthRange = useCallback(() => {
    const today = new Date();
    return {
      startDate: new Date(today.getFullYear(), today.getMonth(), 1),
      endDate: endOfMonth(today)
    };
  }, []);

  // Función para actualizar el rango de fechas
  const updateDateRange = useCallback((newRange: { startDate: Date; endDate: Date }) => {
    console.log("Date range updated:", newRange);
    console.log("Exact date values:", {
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      startDateFormatted: formatDateYYYYMMDD(newRange.startDate),
      endDateFormatted: formatDateYYYYMMDD(newRange.endDate)
    });
    
    // Create shallow copies to preserve the exact selected dates
    const preservedStartDate = new Date(newRange.startDate);
    const preservedEndDate = new Date(newRange.endDate);
    
    setDateRange({
      startDate: preservedStartDate,
      endDate: preservedEndDate
    });

    // Fetch monthly balance when date range changes
    fetchMonthlyBalance(preservedStartDate);
    
    // Check if we need to refresh the cache
    ZohoService.checkAndRefreshCache(preservedStartDate, preservedEndDate);
  }, []);

  // Fetch monthly balance for the selected month
  const fetchMonthlyBalance = useCallback(async (date: Date) => {
    try {
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
      } else {
        console.log("No monthly balance found for:", monthYear);
        setStartingBalance(undefined);
      }
    } catch (err) {
      console.error("Error in fetchMonthlyBalance:", err);
    }
  }, []);

  // Update the starting balance
  const updateStartingBalance = useCallback(async (balance: number, notes?: string) => {
    try {
      const monthYear = formatDate(dateRange.startDate, 'yyyy-MM');
      
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
    
    setStripeIncome(stripeAmount);
    setRegularIncome(regularAmount);
    
    return { stripeAmount, regularAmount };
  }, []);

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

  // Función para cargar los datos (ahora no se carga automáticamente)
  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log("Fetching financial data...");
    setLoading(true);
    setError(null);
    setUsingCachedData(false);

    try {
      // Also fetch the monthly balance for the selected date range
      await fetchMonthlyBalance(dateRange.startDate);
      
      // Log exact date objects for debugging
      console.log("Original dateRange from datepicker:", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      // Format dates using our custom formatter to avoid timezone shifts
      const startDateFormatted = formatDateYYYYMMDD(dateRange.startDate);
      const endDateFormatted = formatDateYYYYMMDD(dateRange.endDate);
      
      console.log("Fetching with exact formatted dates:", {
        startDateRaw: dateRange.startDate,
        startDateFormatted,
        endDateRaw: dateRange.endDate,
        endDateFormatted
      });
      
      // Obtener transacciones de Zoho Books - usando las fechas exactas sin modificaciones
      const zohoData = await ZohoService.getTransactions(
        dateRange.startDate, 
        dateRange.endDate,
        forceRefresh
      );

      // Detectar si estamos usando datos en caché basado en la respuesta
      const rawResponseData = ZohoService.getLastRawResponse();
      if (rawResponseData && rawResponseData.cached) {
        console.log("Using cached data from previous response");
        setUsingCachedData(true);
      }

      // Obtener la respuesta cruda actual para depuración inmediatamente después
      const rawData = ZohoService.getLastRawResponse();
      setRawResponse(rawData);
      console.log("Fetched raw response for debugging:", rawData);

      // Procesar datos de colaboradores
      processCollaboratorData(rawData);

      // Obtener transacciones de Stripe - usando las fechas exactas sin modificaciones
      console.log("Fetching from Stripe:", dateRange.startDate, dateRange.endDate);
      const stripeData = await StripeService.getTransactions(
        dateRange.startDate,
        dateRange.endDate
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
    fetchMonthlyBalance
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
    usingCachedData
  };
};
