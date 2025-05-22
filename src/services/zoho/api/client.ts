
import { Transaction } from "../../../types/financial";
import { handleApiError } from "../utils";
import { getMockTransactions } from "../mockData";
import { supabase } from "@/integrations/supabase/client";
import { PANAMA_TIMEZONE } from "@/utils/timezoneUtils";
import { processRawTransactions, filterExcludedVendors } from "./processor";
import { preparePanamaDates } from "./formatter";

// Function to call the Supabase edge function which handles caching
export const fetchTransactionsFromWebhook = async (
  startDate: Date, 
  endDate: Date, 
  forceRefresh = false,
  returnRawResponse = false
): Promise<Transaction[] | any> => {
  try {
    console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
    console.log("ZohoService: Raw date objects:", {
      startDateObj: startDate,
      startDateType: typeof startDate,
      endDateObj: endDate,
      endDateType: typeof endDate,
      timezone: PANAMA_TIMEZONE
    });
    
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
    
    // First, check the cache via cache-manager
    if (!forceRefresh) {
      console.log("ZohoService: Checking cache via cache-manager");
      
      const { data: cacheData, error: cacheError } = await supabase.functions.invoke("cache-manager", {
        body: {
          source: "Zoho",
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          forceRefresh: false
        }
      });
      
      if (cacheError) {
        console.error("Error checking cache via cache-manager:", cacheError);
      } else if (cacheData?.cached && cacheData?.data) {
        console.log("ZohoService: Cache hit via cache-manager");
        
        // Return the cached data
        if (returnRawResponse) {
          return { 
            cached: true, 
            source: "cache", 
            data: cacheData.data,
            raw_response: cacheData
          };
        }
        
        return filterExcludedVendors(cacheData.data);
      }
      
      console.log("ZohoService: Cache miss or error, proceeding to fetch from zoho-transactions");
    } else {
      console.log("ZohoService: Force refresh requested");
    }
    
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
      const errorMessage = handleApiError({details: error.message}, 'Failed to fetch Zoho transactions from Supabase cache');
      console.warn('Falling back to mock data due to error');
      return returnRawResponse ? { error: error.message, raw_response: null } : getMockTransactions(panamaStartDate, panamaEndDate);
    }
    
    if (!data) {
      console.log("No transactions returned from Supabase function, using mock data");
      return returnRawResponse ? { message: "No data returned", data: null, raw_response: null } : getMockTransactions(panamaStartDate, panamaEndDate);
    }
    
    console.log("ZohoService: Received data from Supabase function");
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return data;
    }
    
    // If we received processed transactions directly, use those
    if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
      console.log("Received processed transactions directly from Supabase");
      return filterExcludedVendors(data);
    }
    
    // If we received the processed webhook response, use the cached_transactions field
    if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
      console.log("Using processed transactions from response");
      return filterExcludedVendors(data.cached_transactions);
    }
    
    // Otherwise, process the raw webhook response
    return processRawTransactions(data);
  } catch (err) {
    handleApiError(err, 'Failed to connect to Supabase function');
    // Fall back to mock data
    console.warn('Falling back to mock data due to exception');
    return returnRawResponse ? { error: err instanceof Error ? err.message : 'Unknown error', raw_response: null } : getMockTransactions(startDate, endDate);
  }
};
