
import { useState, useEffect, useCallback } from 'react';
import ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { Transaction } from '@/types/financial';
import { processTransactionData } from '@/services/zoho/utils';
import { endOfMonth, subMonths } from 'date-fns';

export const useFinanceData = () => {
  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [stripeIncome, setStripeIncome] = useState<number>(0);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  
  // Estado del rango de fechas - configurado para mostrar desde el último día del mes anterior hasta el último día del mes actual
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Último día del mes anterior - no añadir +1 al mes para compensar
    const startDate = endOfMonth(subMonths(today, 1));
    // Último día del mes actual
    const endDate = endOfMonth(today);
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Datos financieros procesados
  const financialData = processTransactionData(transactions);

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
    setDateRange(newRange);
  }, []);

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

  // Función para cargar los datos (ahora no se carga automáticamente)
  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log("Fetching financial data...");
    setLoading(true);
    setError(null);

    try {
      // Log exact date objects and their string representations
      console.log("Fetching from Zoho with dates:", {
        startDate: dateRange.startDate,
        startDateISO: dateRange.startDate.toISOString(),
        startDateString: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate,
        endDateISO: dateRange.endDate.toISOString(),
        endDateString: dateRange.endDate.toISOString().split('T')[0],
      });
      
      // Obtener transacciones de Zoho Books
      const zohoData = await ZohoService.getTransactions(
        dateRange.startDate,
        dateRange.endDate,
        forceRefresh
      );

      // Obtener la respuesta cruda actual para depuración inmediatamente después
      const rawData = ZohoService.getLastRawResponse();
      setRawResponse(rawData);
      console.log("Fetched raw response for debugging:", rawData);

      // Obtener transacciones de Stripe
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
  }, [dateRange.startDate, dateRange.endDate, processIncomeTypes]);

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
    regularIncome
  };
};
