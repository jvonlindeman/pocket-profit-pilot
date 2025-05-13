
import { useState, useCallback } from 'react';
import ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import { formatDateYYYYMMDD, logDateInfo } from '@/utils/dateUtils';

export const useFinancialDataFetcher = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);

  // Fetch financial data from external services
  const fetchFinancialData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: {
      onTransactions: (transactions: any[]) => void,
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void,
    }
  ) => {
    // If we've fetched recently and not forcing a refresh, don't fetch again
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTimestamp < 2000) {
      console.log("Skipping fetch, too soon since last fetch");
      return false;
    }
    
    setLastFetchTimestamp(now);
    console.log("Fetching financial data...");
    setLoading(true);
    setError(null);
    setUsingCachedData(false);

    try {
      // Log exact date objects for debugging
      logDateInfo("Original dateRange from datepicker", dateRange);
      
      // Get transactions from Zoho Books - using the exact dates without modifications
      const zohoData = await ZohoService.getTransactions(
        dateRange.startDate, 
        dateRange.endDate,
        forceRefresh
      );

      // Detect if we're using cached data based on the response
      const rawResponseData = ZohoService.getLastRawResponse();
      if (rawResponseData && rawResponseData.cached) {
        console.log("Using cached data from previous response");
        setUsingCachedData(true);
      }

      // Get the current raw response for debugging immediately after
      const rawData = ZohoService.getLastRawResponse();
      setRawResponse(rawData);
      console.log("Fetched raw response for debugging:", rawData);

      // Process collaborator data
      callbacks.onCollaboratorData(rawData);

      // Get transactions from Stripe - always using the API directly
      console.log("Fetching from Stripe:", dateRange.startDate, dateRange.endDate);
      const stripeData = await StripeService.getTransactions(
        dateRange.startDate,
        dateRange.endDate
      );

      // Combine the data
      const combinedData = [...zohoData, ...stripeData.transactions];
      console.log("Combined transactions:", combinedData.length);
      console.log("Stripe data summary:", {
        gross: stripeData.gross,
        fees: stripeData.fees,
        transactionFees: stripeData.transactionFees,
        payoutFees: stripeData.payoutFees,
        net: stripeData.net,
        feePercentage: stripeData.feePercentage
      });
      
      // Process separated income
      callbacks.onIncomeTypes(combinedData, stripeData);
      
      // Update transactions state
      callbacks.onTransactions(combinedData);
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      setError(err.message || "Error al cargar los datos financieros");
      
      // Make sure to get any raw response for debugging even in case of error
      const rawData = ZohoService.getLastRawResponse();
      if (rawData) {
        setRawResponse(rawData);
        console.log("Set raw response after error:", rawData);
      }
      
      setLoading(false);
      return false;
    }
  }, [lastFetchTimestamp]);

  return {
    loading,
    error,
    rawResponse,
    usingCachedData,
    fetchFinancialData,
  };
};
