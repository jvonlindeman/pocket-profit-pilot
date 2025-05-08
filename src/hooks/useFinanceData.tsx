import { useState, useEffect, useCallback } from 'react';
import { formatISO, subMonths, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DateRange, FinancialData, Transaction, MonthlyBalance } from '@/types/financial';
import { supabase } from '@/integrations/supabase/client';
import ZohoService from '@/services/zohoService';

// Definir estructura de datos para estadísticas de caché
interface CacheStats {
  cachedCount: number;
  newCount: number;
  totalCount: number;
}

const DEFAULT_FINANCIAL_DATA: FinancialData = {
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

export const useFinanceData = () => {
  // Estados para manejar fechas y datos
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    return { startDate, endDate };
  });
  
  // Estados para datos financieros y control
  const [financialData, setFinancialData] = useState<FinancialData>(DEFAULT_FINANCIAL_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [partialRefresh, setPartialRefresh] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  
  // Estado para el valor de Stripe override
  const [stripeOverride, setStripeOverride] = useState<number | null>(null);
  
  // Ingresos de Stripe y regulares
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  
  // Colaboradores
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Obtener rango del mes actual
  const getCurrentMonthRange = useCallback(() => {
    const today = new Date();
    return {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    };
  }, []);

  // Función para actualizar el rango de fechas
  const updateDateRange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  // Comprobar si una fecha está dentro del rango actual
  const isDateInRange = useCallback((date: string) => {
    const parsedDate = new Date(date);
    return (
      !isBefore(parsedDate, dateRange.startDate) && 
      !isAfter(parsedDate, dateRange.endDate)
    );
  }, [dateRange]);

  // Función para cargar los datos de Stripe y el balance mensual
  const loadStripeAndBalanceData = useCallback(async () => {
    try {
      // Cargar el balance mensual
      const monthString = formatISO(dateRange.startDate, { representation: 'date' }).substring(0, 7);
      const { data: balanceData, error: balanceError } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('month_year', monthString)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error("Error loading monthly balance:", balanceError);
      }

      if (balanceData) {
        // Si hay un valor de override de Stripe, establecerlo
        if (balanceData.stripe_override !== null) {
          // Convertir el valor si viene con formato europeo (comas y puntos)
          let overrideValue = balanceData.stripe_override;
          
          // Si es string y tiene coma como separador decimal, convertirlo
          if (typeof overrideValue === 'string') {
            const strValue = String(overrideValue);
            if (strValue.includes(',')) {
              overrideValue = parseFloat(strValue.replace('.', '').replace(',', '.'));
            }
          }
          
          setStripeOverride(overrideValue);
          setStripeIncome(overrideValue);
          console.log("Using Stripe override value:", overrideValue);
        }
      } else {
        // Si no hay datos de balance mensual, resetear el valor de Stripe override
        setStripeOverride(null);
      }

      // Si no estamos usando un valor override, cargar las transacciones de Stripe
      if (balanceData?.stripe_override === null || balanceData?.stripe_override === undefined) {
        // Cargar transacciones de Stripe
        const { data: stripeTransactions, error: stripeError } = await supabase
          .from('cached_transactions')
          .select('*')
          .eq('source', 'Stripe')
          .eq('type', 'income');

        if (stripeError) {
          console.error("Error loading Stripe transactions:", stripeError);
        }

        if (stripeTransactions) {
          // Filtrar las transacciones que están en el rango de fechas actual
          const filteredTransactions = stripeTransactions.filter(tx => isDateInRange(tx.date));
          // Calcular la suma de los importes - asegurar que se convierta a número
          const total = filteredTransactions.reduce((sum, tx) => {
            // Si es string, asegurar formato adecuado
            const amount = typeof tx.amount === 'string' 
              ? parseFloat(String(tx.amount).replace(',', '.'))
              : Number(tx.amount);
            return sum + amount;
          }, 0);
          setStripeIncome(total);
          console.log("Calculated Stripe income from transactions:", total);
        }
      }

      return balanceData as MonthlyBalance | null;
    } catch (err) {
      console.error("Error in loadStripeAndBalanceData:", err);
      return null;
    }
  }, [dateRange, isDateInRange]);
  
  // Función principal para obtener datos financieros
  const fetchFinancialData = useCallback(async (forceRefresh: boolean = false) => {
    console.log(`Fetching financial data with forceRefresh=${forceRefresh}`);
    setLoading(true);
    setError(null);
    setUsingCachedData(false);
    setPartialRefresh(false);
    setCacheStats(null);

    try {
      // Primero, cargamos los datos de Stripe y el balance mensual
      const balanceData = await loadStripeAndBalanceData();
      
      // Formateamos las fechas para la API
      const startDate = formatISO(dateRange.startDate, { representation: 'date' });
      const endDate = formatISO(dateRange.endDate, { representation: 'date' });
      
      // Construimos los parámetros para la llamada a la API
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        force_refresh: forceRefresh ? 'true' : 'false'
      });
      
      let data;
      let apiError = null;
      
      try {
        // Hacemos la llamada a la API usando la función invoke de Supabase
        console.log(`Invoking zoho-transactions function with params: ${params.toString()}`);
        const result = await supabase.functions.invoke("zoho-transactions", {
          body: {
            startDate: startDate,
            endDate: endDate,
            forceRefresh: forceRefresh
          }
        });
        
        if (result.error) {
          throw new Error(`Error al invocar la función zoho-transactions: ${result.error.message || result.error}`);
        }
        
        data = result.data;
        
        if (!data) {
          throw new Error("No se recibieron datos de la función zoho-transactions");
        }
        
        console.log("Data received from zoho-transactions function:", data);
      } catch (invokeError) {
        console.error("Error calling zoho-transactions function:", invokeError);
        apiError = invokeError;
        
        // Intentar con el método alternativo usando fetch
        try {
          console.log("Falling back to direct fetch method");
          // Hacemos la llamada a la API usando fetch directamente
          const response = await fetch(`/functions/v1/zoho-transactions?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Verificar que la respuesta es JSON antes de intentar procesarla
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error("Received non-JSON response:", textResponse.substring(0, 200) + "...");
            throw new Error(`Respuesta no JSON recibida del servidor: ${response.status} ${response.statusText}`);
          }
          
          data = await response.json();
          console.log("Data received from direct API call:", data);
        } catch (fetchError) {
          console.error("Error with direct fetch call:", fetchError);
          // Si ambos métodos fallan, lanzar el error original
          throw apiError || new Error("Error al obtener datos financieros");
        }
      }
      
      setRawResponse(data);
      
      // Determinar si estamos usando datos en caché
      if (data.cache_status) {
        setUsingCachedData(data.cache_status.using_cached_data || false);
        setPartialRefresh(data.cache_status.partial_refresh || false);
        
        if (data.cache_status.stats) {
          setCacheStats({
            cachedCount: data.cache_status.stats.cached_count || 0,
            newCount: data.cache_status.stats.new_count || 0,
            totalCount: data.cache_status.stats.total_count || 0
          });
        }
      }
      
      // Actualizar el estado con los datos obtenidos
      if (data.financial_data) {
        // Agregamos el saldo inicial si está disponible
        if (balanceData && typeof balanceData.balance === 'number') {
          data.financial_data.summary.startingBalance = balanceData.balance;
        }

        // Procesar ingresos de Stripe correctamente
        let stripeIncomeValue = stripeIncome;
        
        // Si hay un valor de Stripe override, asegurarse de que sea numérico
        if (stripeOverride !== null) {
          // Si es string, convertirlo a numero
          if (typeof stripeOverride === 'string') {
            const strValue = String(stripeOverride);
            if (strValue.includes(',')) {
              stripeIncomeValue = parseFloat(strValue.replace('.', '').replace(',', '.'));
            } else {
              stripeIncomeValue = Number(stripeOverride);
            }
          } else {
            stripeIncomeValue = Number(stripeOverride);
          }
          console.log("Using Stripe override value (processed):", stripeIncomeValue);
        }

        // Separamos los ingresos de Zoho (regulares) de los ingresos totales
        const regularIncomeValue = data.financial_data.summary.totalIncome;
        setRegularIncome(regularIncomeValue);
        
        // Actualizamos el resumen con el ingreso de Stripe (puede ser override o calculado)
        // y recalculamos profit y profitMargin
        const totalIncome = regularIncomeValue + stripeIncomeValue;
        const totalExpense = data.financial_data.summary.totalExpense;
        const profit = totalIncome - totalExpense;
        const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
        
        console.log("Financial summary calculation:", {
          regularIncome: regularIncomeValue,
          stripeIncome: stripeIncomeValue,
          totalIncome,
          totalExpense,
          profit,
          profitMargin
        });
        
        data.financial_data.summary.totalIncome = totalIncome;
        data.financial_data.summary.profit = profit;
        data.financial_data.summary.profitMargin = profitMargin;
        
        setFinancialData(data.financial_data);
        
        // Extraer los gastos de colaboradores si existen
        if (data.collaborator_expenses) {
          setCollaboratorExpenses(data.collaborator_expenses);
        }

        toast({
          title: "Datos financieros actualizados",
          description: `Ingresos: $${totalIncome.toFixed(2)}, Gastos: $${totalExpense.toFixed(2)}`,
        });
      }
      
      // Marcar los datos como inicializados
      setDataInitialized(true);
    } catch (err) {
      console.error("Error fetching financial data:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al obtener datos");
      toast({
        variant: "destructive",
        title: "Error al obtener datos",
        description: err instanceof Error ? err.message : "Error desconocido al obtener datos",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, loadStripeAndBalanceData, stripeIncome, stripeOverride, toast]);

  // Efecto para actualizar datos cuando cambia el rango de fechas
  useEffect(() => {
    if (dataInitialized) {
      fetchFinancialData(false);
    }
  }, [dateRange, dataInitialized, fetchFinancialData]);

  // Función para limpiar el caché y forzar una actualización completa
  const clearCacheAndRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, clear the cache for the current date range
      const success = await ZohoService.clearCacheForDateRange(dateRange.startDate, dateRange.endDate);
      
      if (success) {
        toast({
          title: "Caché limpiado con éxito",
          description: "Se va a obtener datos frescos de la API",
        });
        
        // Then force refresh the data
        await fetchFinancialData(true);
      } else {
        throw new Error("No se pudo limpiar el caché");
      }
    } catch (err) {
      console.error("Error clearing cache:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al limpiar el caché");
      toast({
        variant: "destructive",
        title: "Error al limpiar el caché",
        description: err instanceof Error ? err.message : "Error desconocido al limpiar el caché",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, fetchFinancialData, toast]);

  return {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData: fetchFinancialData,
    clearCacheAndRefresh,
    dataInitialized,
    rawResponse,
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    usingCachedData,
    partialRefresh,
    cacheStats,
    stripeOverride
  };
};
