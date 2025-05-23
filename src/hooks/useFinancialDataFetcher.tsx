
import { useState, useCallback } from 'react';
import { financialService } from '@/services/financialService';
import { zohoRepository } from '@/repositories/zohoRepository';

/**
 * Base hook for fetching financial data
 */
export const useFinancialDataFetcher = () => {
  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [apiConnectivity, setApiConnectivity] = useState<{
    zoho: boolean,
    stripe: boolean
  }>({
    zoho: true,
    stripe: true
  });

  // Check API connectivity
  const checkApiConnectivity = useCallback(async () => {
    const result = await financialService.checkApiConnectivity();
    setApiConnectivity(result);
    return result;
  }, []);

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
    setLoading(true);
    setError(null);
    
    try {
      // Check connectivity first
      await checkApiConnectivity();
      
      // Fetch the financial data
      const success = await financialService.fetchFinancialData(
        dateRange, 
        forceRefresh, 
        callbacks
      );
      
      // Get raw response for debugging - use the cached data
      const rawData = zohoRepository.getLastRawResponse();
      if (rawData) {
        console.log("useFinancialDataFetcher: Using cached raw response");
        setRawResponse(rawData);
      }
      
      setLoading(false);
      return success;
    } catch (err: any) {
      console.error("Error in fetchFinancialData:", err);
      setError(err.message || "Error al cargar los datos financieros");
      setLoading(false);
      return false;
    }
  }, [checkApiConnectivity]);

  return {
    loading,
    error,
    rawResponse,
    fetchFinancialData,
    apiConnectivity,
    checkApiConnectivity
  };
};
