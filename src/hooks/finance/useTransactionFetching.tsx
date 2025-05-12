
import { useState, useCallback } from 'react';
import ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { Transaction } from '@/types/financial';
import { DateRange } from '@/types/financial';

export const useTransactionFetching = (
  dateRange: DateRange,
  formatDateYYYYMMDD: (date: Date) => string,
  fetchMonthlyBalance: (date: Date) => Promise<void>
) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);

  // Función para cargar los datos
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

      // Obtener transacciones de Stripe - usando las fechas exactas sin modificaciones
      console.log("Fetching from Stripe:", dateRange.startDate, dateRange.endDate);
      const stripeData = await StripeService.getTransactions(
        dateRange.startDate,
        dateRange.endDate
      );

      // Combinar los datos
      const combinedData = [...zohoData, ...stripeData];
      console.log("Combined transactions:", combinedData.length);
      
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
  }, [dateRange.startDate, dateRange.endDate, fetchMonthlyBalance, formatDateYYYYMMDD]);

  // Función pública para refrescar datos (forzando o no)
  const refreshData = useCallback((force = false) => {
    fetchData(force);
  }, [fetchData]);

  return {
    transactions,
    loading,
    error,
    dataInitialized,
    rawResponse,
    usingCachedData,
    fetchData,
    refreshData
  };
};
