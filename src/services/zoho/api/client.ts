import { Transaction } from "../../../types/financial";
import { handleApiError } from "../utils";
import { getMockTransactions } from "../mockData";
import { supabase } from "@/integrations/supabase/client";
import { PANAMA_TIMEZONE } from "@/utils/timezoneUtils";
import { processRawTransactions, filterExcludedVendors } from "./processor";
import { preparePanamaDates } from "./formatter";

// Simple in-memory request deduplication cache
interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
    data?: any;
  }
}

const requestCache: RequestCache = {};
const REQUEST_CACHE_TTL = 30000; // 30 seconds

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
    
    // Request deduplication - create a cache key
    const cacheKey = `zoho-${formattedStartDate}-${formattedEndDate}-${forceRefresh}-${returnRawResponse}`;
    const now = Date.now();
    
    // Check if we have an in-progress request or recent result
    if (requestCache[cacheKey]) {
      const cachedRequest = requestCache[cacheKey];
      
      // If the request is still in-flight, return the same promise
      if (!cachedRequest.data) {
        console.log("ZohoService: Reusing in-progress request for", formattedStartDate, "to", formattedEndDate);
        return cachedRequest.promise;
      }
      
      // If we have recently completed this request (within TTL), return the cached data
      if (now - cachedRequest.timestamp < REQUEST_CACHE_TTL) {
        console.log("ZohoService: Using cached request result for", formattedStartDate, "to", formattedEndDate);
        return cachedRequest.data;
      }
    }
    
    // First, check the cache via cache-manager
    if (!forceRefresh) {
      console.log("ZohoService: Checking cache via cache-manager");
      
      // Create a new promise for this request and store it in the cache
      const promise = (async () => {
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
          const result = returnRawResponse 
            ? { cached: true, source: "cache", data: cacheData.data, raw_response: cacheData }
            : filterExcludedVendors(cacheData.data);
          
          // Store the result in the cache
          if (requestCache[cacheKey]) {
            requestCache[cacheKey].data = result;
            requestCache[cacheKey].timestamp = Date.now();
          }
          
          return result;
        }
        
        console.log("ZohoService: Cache miss or error, proceeding to fetch from zoho-transactions");
        
        // Proceed with the actual API call
        return fetchFromZohoTransactions(
          formattedStartDate,
          formattedEndDate,
          forceRefresh,
          returnRawResponse,
          panamaStartDate,
          panamaEndDate,
          cacheKey
        );
      })();
      
      // Store the promise in the cache
      requestCache[cacheKey] = {
        promise,
        timestamp: now
      };
      
      return promise;
    } else {
      console.log("ZohoService: Force refresh requested");
      
      // Create a new promise for this request and store it in the cache
      const promise = fetchFromZohoTransactions(
        formattedStartDate,
        formattedEndDate,
        forceRefresh,
        returnRawResponse,
        panamaStartDate,
        panamaEndDate,
        cacheKey
      );
      
      // Store the promise in the cache
      requestCache[cacheKey] = {
        promise,
        timestamp: now
      };
      
      return promise;
    }
  } catch (err) {
    handleApiError(err, 'Failed to connect to Supabase function');
    // Fall back to mock data
    console.warn('Falling back to mock data due to exception');
    return returnRawResponse ? { error: err instanceof Error ? err.message : 'Unknown error', raw_response: null } : getMockTransactions(startDate, endDate);
  }
};

// Helper function to fetch data from zoho-transactions edge function
async function fetchFromZohoTransactions(
  formattedStartDate: string,
  formattedEndDate: string,
  forceRefresh: boolean,
  returnRawResponse: boolean,
  panamaStartDate: Date,
  panamaEndDate: Date,
  cacheKey: string
): Promise<any> {
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
    
    const result = returnRawResponse 
      ? { error: error.message, raw_response: null } 
      : getMockTransactions(panamaStartDate, panamaEndDate);
    
    // Store the result in the cache
    if (requestCache[cacheKey]) {
      requestCache[cacheKey].data = result;
      requestCache[cacheKey].timestamp = Date.now();
    }
    
    return result;
  }
  
  if (!data) {
    console.log("No transactions returned from Supabase function, using mock data");
    
    const result = returnRawResponse 
      ? { message: "No data returned", data: null, raw_response: null } 
      : getMockTransactions(panamaStartDate, panamaEndDate);
    
    // Store the result in the cache
    if (requestCache[cacheKey]) {
      requestCache[cacheKey].data = result;
      requestCache[cacheKey].timestamp = Date.now();
    }
    
    return result;
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
    // Store the result in the cache
    if (requestCache[cacheKey]) {
      requestCache[cacheKey].data = data;
      requestCache[cacheKey].timestamp = Date.now();
    }
    
    return data;
  }
  
  // If we received processed transactions directly, use those
  if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
    console.log(`Received ${data.length} processed transactions directly from Supabase`);
    
    const result = filterExcludedVendors(data);
    
    // Store the result in the cache
    if (requestCache[cacheKey]) {
      requestCache[cacheKey].data = result;
      requestCache[cacheKey].timestamp = Date.now();
    }
    
    return result;
  }
  
  // If we received the processed webhook response, use the cached_transactions field
  if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
    console.log(`Using ${data.cached_transactions.length} processed transactions from response`);
    
    const result = filterExcludedVendors(data.cached_transactions);
    
    // Store the result in the cache
    if (requestCache[cacheKey]) {
      requestCache[cacheKey].data = result;
      requestCache[cacheKey].timestamp = Date.now();
    }
    
    return result;
  }
  
  // Otherwise, process the raw webhook response
  const transactions = processRawTransactions(data);
  console.log(`Processed ${transactions.length} transactions from raw webhook data`);
  
  const result = transactions;
  
  // Store the result in the cache
  if (requestCache[cacheKey]) {
    requestCache[cacheKey].data = result;
    requestCache[cacheKey].timestamp = Date.now();
  }
  
  return result;
}
