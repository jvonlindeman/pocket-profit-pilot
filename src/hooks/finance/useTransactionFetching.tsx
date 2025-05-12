
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

  // Function to apply Stripe income override to transactions list
  const applyStripeOverride = useCallback((stripeOverride: number) => {
    console.log(`Applying Stripe override: ${stripeOverride}`);
    
    setTransactions(currentTransactions => {
      // Find the Stripe transaction if it exists
      const stripeTransactions = currentTransactions.filter(tx => 
        tx.source === 'Stripe' && tx.type === 'income'
      );
      
      // Create a new array with all non-Stripe transactions
      const nonStripeTransactions = currentTransactions.filter(tx => 
        !(tx.source === 'Stripe' && tx.type === 'income')
      );
      
      if (stripeTransactions.length === 0) {
        // If no Stripe transaction exists, create a new one
        const today = new Date().toISOString().split('T')[0];
        console.log(`Creating new Stripe transaction with override: ${stripeOverride}`);
        const newStripeTransaction: Transaction = {
          id: `stripe-override-${today}`,
          date: today,
          amount: stripeOverride,
          description: 'Ingresos de Stripe (Manual)',
          category: 'Ingresos por plataforma',
          source: 'Stripe',
          type: 'income'
        };
        
        return [...nonStripeTransactions, newStripeTransaction];
      }
      
      // Update existing Stripe transactions
      console.log(`Updating ${stripeTransactions.length} existing Stripe transactions with override: ${stripeOverride}`);
      const updatedStripeTransactions = stripeTransactions.map(tx => {
        // Remove any existing (Manual) text to avoid duplication
        const baseDescription = tx.description.replace(' (Manual)', '');
        return {
          ...tx,
          amount: stripeOverride,
          description: `${baseDescription} (Manual)`,
        };
      });
      
      // Return combined transactions
      return [...nonStripeTransactions, ...updatedStripeTransactions];
    });
  }, []);

  // Función para cargar los datos
  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log("Fetching financial data...");
    console.log(`Date range: ${formatDateYYYYMMDD(dateRange.startDate)} to ${formatDateYYYYMMDD(dateRange.endDate)}`);
    console.log(`Force refresh: ${forceRefresh}`);
    
    setLoading(true);
    setError(null);
    setUsingCachedData(false);

    try {
      // Also fetch the monthly balance for the selected date range
      await fetchMonthlyBalance(dateRange.startDate);
      
      // Format dates using our custom formatter to avoid timezone shifts
      const startDateFormatted = formatDateYYYYMMDD(dateRange.startDate);
      const endDateFormatted = formatDateYYYYMMDD(dateRange.endDate);
      
      console.log("Fetching with formatted dates:", {
        startDateFormatted,
        endDateFormatted
      });
      
      // Obtener transacciones de Zoho Books - usando las fechas exactas sin modificaciones
      console.log(`Calling ZohoService.getTransactions with dates: ${startDateFormatted} to ${endDateFormatted}, forceRefresh: ${forceRefresh}`);
      const zohoData = await ZohoService.getTransactions(
        dateRange.startDate, 
        dateRange.endDate,
        forceRefresh
      );
      console.log(`Received ${zohoData.length} transactions from Zoho`);
      
      // Log transaction types to help debug
      const zohoIncome = zohoData.filter(tx => tx.type === 'income');
      const zohoExpenses = zohoData.filter(tx => tx.type === 'expense');
      console.log(`Zoho data breakdown: ${zohoIncome.length} income, ${zohoExpenses.length} expenses`);
      
      if (zohoIncome.length > 0) {
        console.log("Sample income transaction:", zohoIncome[0]);
      }
      
      if (zohoExpenses.length > 0) {
        console.log("Sample expense transaction:", zohoExpenses[0]);
      }

      // Detectar si estamos usando datos en caché basado en la respuesta
      const rawResponseData = ZohoService.getLastRawResponse();
      if (rawResponseData && rawResponseData.cached) {
        console.log("Using cached data from previous response");
        setUsingCachedData(true);
      }

      // Obtener la respuesta cruda actual para depuración inmediatamente después
      const rawData = ZohoService.getLastRawResponse();
      setRawResponse(rawData);
      console.log("Raw response structure for debugging:", 
        rawData ? typeof rawData : "No raw data");

      // Obtener transacciones de Stripe - usando las fechas exactas sin modificaciones
      console.log("Fetching from Stripe:", formatDateYYYYMMDD(dateRange.startDate), formatDateYYYYMMDD(dateRange.endDate));
      const stripeData = await StripeService.getTransactions(
        dateRange.startDate,
        dateRange.endDate
      );
      console.log(`Received ${stripeData.length} transactions from Stripe`);

      // Combinar los datos
      const combinedData = [...zohoData, ...stripeData];
      console.log("Combined transactions:", combinedData.length);
      
      // Crucial logging: Check what we're about to set as the transactions state
      console.log("About to set transactions state with:", {
        count: combinedData.length,
        income: combinedData.filter(tx => tx.type === 'income').length,
        expense: combinedData.filter(tx => tx.type === 'expense').length,
        firstFew: combinedData.slice(0, 3).map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          source: tx.source
        }))
      });
      
      // Log amount totals for income and expense
      const incomeTotal = combinedData
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const expenseTotal = combinedData
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      console.log(`Transaction totals: Income=${incomeTotal}, Expense=${expenseTotal}, Net=${incomeTotal-expenseTotal}`);
      
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
        console.log("Set raw response after error:", 
          rawData ? typeof rawData : "No raw data");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, fetchMonthlyBalance, formatDateYYYYMMDD]);

  // Función pública para refrescar datos (forzando o no)
  const refreshData = useCallback((force = false) => {
    console.log(`Refreshing data with force=${force}`);
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
    refreshData,
    applyStripeOverride
  };
};
