
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDateForAPI } from '@/lib/date-utils';
import { DateRange } from '@/types/financial';
import { withTimeout } from '@/utils/apiUtils';
import { API_TIMEOUT_MS } from '@/constants/financialDefaults';

export const useFinanceAPI = () => {
  const { toast } = useToast();

  /**
   * Fetch financial data from Supabase Edge Function
   * @param dateRange Date range for which to fetch data
   * @param forceRefresh Force refresh from API instead of using cache
   * @param startingBalanceData Optional starting balance data
   */
  const fetchFinanceDataFromAPI = useCallback(async (
    dateRange: DateRange,
    forceRefresh: boolean = false,
    startingBalanceData?: { starting_balance: number }
  ) => {
    try {
      // Format dates for API call
      const formattedStartDate = formatDateForAPI(dateRange.startDate);
      const formattedEndDate = formatDateForAPI(dateRange.endDate);
      
      console.log('📆 Formatted dates for API call:', formattedStartDate, formattedEndDate);
      
      // Prepare params for API call
      const params = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        forceRefresh: forceRefresh,
        ...(startingBalanceData && { starting_balance: startingBalanceData.starting_balance })
      };
      
      console.log(`🔄 Invoking zoho-transactions function with params:`, params);
      
      try {
        // Try using Supabase function invoke with timeout
        const result = await withTimeout(
          supabase.functions.invoke("zoho-transactions", { body: params }),
          API_TIMEOUT_MS
        );
        
        if (result.error) {
          console.error("❌ Supabase function returned an error:", result.error);
          throw new Error(`Error al invocar la función zoho-transactions: ${result.error.message || JSON.stringify(result.error)}`);
        }
        
        const data = result.data;
        
        if (!data) {
          console.error("❌ No data received from zoho-transactions function");
          throw new Error("No se recibieron datos de la función zoho-transactions");
        }
        
        console.log("✅ Data received from zoho-transactions function:", data);
        return data;
      } catch (invokeError: any) {
        console.error("❌ Error calling zoho-transactions function:", invokeError);
        
        // Fallback to direct fetch with more detailed error handling
        console.log("⚠️ Falling back to direct fetch method");
        const queryParams = new URLSearchParams({
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          force_refresh: forceRefresh ? 'true' : 'false'
        });
        
        // Add starting_balance to query params if available
        if (startingBalanceData?.starting_balance !== undefined) {
          queryParams.append('starting_balance', startingBalanceData.starting_balance.toString());
        }
        
        try {
          console.log("⚠️ Attempting direct fetch with URL:", `/functions/v1/zoho-transactions?${queryParams.toString()}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
          
          const response = await fetch(`/functions/v1/zoho-transactions?${queryParams.toString()}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'If-Modified-Since': new Date(0).toUTCString()
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error("❌ HTTP error response:", response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Check for JSON content type
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error("⚠️ Received non-JSON response:", textResponse.substring(0, 200) + "...");
            throw new Error(`Respuesta no JSON recibida del servidor: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("✅ Data received from direct API call:", data);
          return data;
        } catch (fetchError: any) {
          // Check if this is an abort error
          if (fetchError.name === 'AbortError') {
            console.error("❌ Direct fetch aborted due to timeout");
            throw new Error(`La petición se canceló después de ${API_TIMEOUT_MS/1000} segundos de espera`);
          }
          
          console.error("❌ Error with direct fetch call:", fetchError);
          // Throw the original error if direct fetch also fails
          throw invokeError || fetchError || new Error("Error al obtener datos financieros");
        }
      }
    } catch (err: any) {
      console.error("❌ Error in fetchFinanceDataFromAPI:", err);
      
      // Create a more user-friendly error message
      let errorMessage = "Error desconocido al obtener datos financieros";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      }
      
      // Show toast with more detailed error message
      toast({
        variant: "destructive",
        title: "Error de comunicación con el API",
        description: errorMessage,
      });
      
      throw err;
    }
  }, [toast]);

  return { fetchFinanceDataFromAPI };
};
