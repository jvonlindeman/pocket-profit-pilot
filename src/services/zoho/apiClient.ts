
import { Transaction, UnpaidInvoice } from "@/types/financial";
import { ZohoTransactionResponse } from "./api/types";
import { handleApiError } from "./utils";
import { getMockTransactions } from "./mockData";
import { supabase } from "@/integrations/supabase/client";
import { PANAMA_TIMEZONE } from "@/utils/timezoneUtils";
import { processRawTransactions, filterExcludedVendors, processUnpaidInvoices } from "./api/processor";
import { preparePanamaDates } from "./api/formatter";
import { apiRequestManager } from "@/utils/ApiRequestManager";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";

/**
 * Unified gateway function to fetch Zoho data
 * All Zoho data requests should go through this function
 */
export const fetchZohoData = async (
  startDate: Date, 
  endDate: Date, 
  forceRefresh = false,
  returnRawResponse = false
): Promise<Transaction[] | any> => {
  console.log(`ZohoApiClient: Unified gateway call for dates ${startDate.toDateString()} to ${endDate.toDateString()}`);
  
  // Prepare dates in Panama timezone
  const { 
    panamaStartDate, 
    panamaEndDate, 
    formattedStartDate, 
    formattedEndDate 
  } = preparePanamaDates(startDate, endDate);
  
  // Generate a simple cache key based ONLY on the date range and raw flag
  // This ensures maximum cache hits across different call sites
  const cacheKey = `zoho-data-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}-${returnRawResponse}`;
  
  console.log(`ZohoApiClient: Using cache key: ${cacheKey}, forceRefresh: ${forceRefresh}`);
  
  // If we're forcing a refresh, clear any existing cache entry
  if (forceRefresh) {
    console.log(`ZohoApiClient: Force refresh requested, clearing cache entry`);
    apiRequestManager.clearCacheEntry(cacheKey);
  }
  
  // Use the ApiRequestManager to execute the request with deduplication
  return await apiRequestManager.executeRequest(
    cacheKey,
    async () => {
      console.log(`ZohoApiClient: Making actual API call for ${cacheKey}`);
      try {
        // Call the Supabase edge function to get transactions
        const { data, error } = await supabase.functions.invoke("zoho-transactions", {
          body: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            rawResponse: returnRawResponse
          }
        });
        
        if (error) {
          console.error("Failed to fetch data from Supabase function:", error);
          
          // If we get an error, use mock data
          handleApiError({details: error.message}, 'Failed to fetch Zoho transactions from Supabase');
          console.warn('Falling back to mock data due to error');
          
          return returnRawResponse 
            ? { error: error.message, raw_response: null } 
            : getMockTransactions(panamaStartDate, panamaEndDate);
        }
        
        if (!data) {
          console.log("No transactions returned from Supabase function, using mock data");
          
          return returnRawResponse 
            ? { message: "No data returned", data: null, raw_response: null } 
            : getMockTransactions(panamaStartDate, panamaEndDate);
        }
        
        // Log what we received from the edge function
        console.log("ZohoApiClient: Received data from edge function:", {
          isArray: Array.isArray(data),
          hasPayments: data.payments && Array.isArray(data.payments),
          hasExpenses: data.expenses && Array.isArray(data.expenses),
          hasCollaborators: data.colaboradores && Array.isArray(data.colaboradores),
          hasCachedTransactions: data.cached_transactions && Array.isArray(data.cached_transactions),
          dataKeys: Object.keys(data)
        });
        
        // Return raw response for debugging if requested
        if (returnRawResponse) {
          return data;
        }
        
        return data;
      } catch (err) {
        console.error("Error in fetchZohoData:", err);
        handleApiError(err, 'Failed to connect to Supabase function');
        
        // Fall back to mock data
        console.warn('Falling back to mock data due to exception');
        return returnRawResponse 
          ? { error: err instanceof Error ? err.message : 'Unknown error', raw_response: null } 
          : getMockTransactions(startDate, endDate);
      }
    }
  );
};

/**
 * Process the API response into a structured format
 */
export const processTransactionResponse = (response: any): Transaction[] => {
  if (!response) return [];
  
  // Structure the response into our ZohoTransactionResponse format
  const structuredResponse: ZohoTransactionResponse = response;
  
  // Process the structured data to extract transactions
  return processRawTransactions(structuredResponse);
};

/**
 * Process unpaid invoices from the API response
 */
export const processUnpaidInvoicesResponse = (response: any): UnpaidInvoice[] => {
  if (!response) return [];
  
  // Structure the response into our ZohoTransactionResponse format
  const structuredResponse: ZohoTransactionResponse = response;
  
  // Process the structured data to extract unpaid invoices
  return processUnpaidInvoices(structuredResponse);
};

// Legacy function name for backward compatibility
export const fetchTransactionsFromWebhook = fetchZohoData;
