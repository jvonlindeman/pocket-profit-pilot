import { Transaction } from "../../../types/financial";
import { handleApiError } from "../utils";
import { getMockTransactions } from "../mockData";
import { supabase } from "@/integrations/supabase/client";
import { PANAMA_TIMEZONE } from "@/utils/timezoneUtils";
import { processRawTransactions, filterExcludedVendors } from "./processor";
import { preparePanamaDates } from "./formatter";
import { apiRequestManager } from "@/utils/ApiRequestManager";

// Function to call the Supabase edge function which handles caching
export const fetchTransactionsFromWebhook = async (
  startDate: Date, 
  endDate: Date, 
  forceRefresh = false,
  returnRawResponse = false
): Promise<Transaction[] | any> => {
  try {
    console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
    
    // Prepare dates in Panama timezone
    const { 
      panamaStartDate, 
      panamaEndDate, 
      formattedStartDate, 
      formattedEndDate 
    } = preparePanamaDates(startDate, endDate);
    
    console.log("ZohoService: Formatted Panama dates:", {
      startDate: panamaStartDate.toString(),
      formattedStartDate,
      endDate: panamaEndDate.toString(),
      formattedEndDate,
      timezone: PANAMA_TIMEZONE
    });
    
    // Generate a cache key for this request
    const cacheKey = `zoho-${formattedStartDate}-${formattedEndDate}-${forceRefresh}-${returnRawResponse}`;
    
    // If we're forcing a refresh, clear any existing cache entry
    if (forceRefresh) {
      apiRequestManager.clearCacheEntry(cacheKey);
    }
    
    // Use the ApiRequestManager to execute the request
    return await apiRequestManager.executeRequest(
      cacheKey,
      async () => {
        // Call the Supabase edge function to get transactions
        const { data, error } = await supabase.functions.invoke("zoho-transactions", {
          body: {
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            forceRefresh
          }
        });
        
        if (error) {
          console.error("Failed to fetch data from Supabase function:", error);
          
          // If we get an error, use mock data
          handleApiError({details: error.message}, 'Failed to fetch Zoho transactions from Supabase cache');
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
        
        console.log("ZohoService: Received data from Supabase function", {
          isArray: Array.isArray(data),
          hasPayments: data.payments && Array.isArray(data.payments),
          hasExpenses: data.expenses && Array.isArray(data.expenses),
          hasCollaborators: data.colaboradores && Array.isArray(data.colaboradores),
          hasCachedTransactions: data.cached_transactions && Array.isArray(data.cached_transactions)
        });
        
        // Return raw response for debugging if requested
        if (returnRawResponse) {
          return data;
        }
        
        // If we received processed transactions directly, use those
        if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
          console.log(`Received ${data.length} processed transactions directly from Supabase`);
          return filterExcludedVendors(data);
        }
        
        // If we received the processed webhook response, use the cached_transactions field
        if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
          console.log(`Using ${data.cached_transactions.length} processed transactions from response`);
          return filterExcludedVendors(data.cached_transactions);
        }
        
        // Otherwise, process the raw webhook response
        const transactions = processRawTransactions(data);
        console.log(`Processed ${transactions.length} transactions from raw webhook data`);
        
        return transactions;
      }
    );
  } catch (err) {
    handleApiError(err, 'Failed to connect to Supabase function');
    // Fall back to mock data
    console.warn('Falling back to mock data due to exception');
    return returnRawResponse ? { error: err instanceof Error ? err.message : 'Unknown error', raw_response: null } : getMockTransactions(startDate, endDate);
  }
};
