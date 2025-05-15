// Re-export from new modular structure
export { fetchTransactionsFromWebhook } from "./api/client";
export { processRawTransactions, filterExcludedVendors } from "./api/processor";
export { formatDateYYYYMMDD, normalizeSource, normalizeType, preparePanamaDates } from "./api/formatter";
export { excludedVendors } from "./api/config";

// Cache the last API response to prevent duplicate API calls
let lastApiRequest = {
  startDate: '',
  endDate: '',
  timestamp: 0,
  response: null as any,
  isCached: false
};

// Function to call the Supabase edge function which handles caching
export const fetchTransactionsFromWebhook = async (
  startDate: Date, 
  endDate: Date, 
  forceRefresh = false,
  returnRawResponse = false
): Promise<Transaction[] | any> => {
  try {
    console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
    console.log("ZohoService: Force refresh?", forceRefresh);

    // Prepare dates in Panama timezone
    const { 
      panamaStartDate, 
      panamaEndDate, 
      formattedStartDate, 
      formattedEndDate 
    } = preparePanamaDates(startDate, endDate);

    // Check for recent identical request to prevent duplicate calls
    const requestKey = `${formattedStartDate}-${formattedEndDate}-${forceRefresh}`;
    const now = Date.now();
    
    // Check memory cache
    if (!forceRefresh && 
        lastApiRequest.startDate === formattedStartDate && 
        lastApiRequest.endDate === formattedEndDate && 
        now - lastApiRequest.timestamp < 60000) { // 1 minute cache
      
      console.log("ZohoService: Using cached API response from memory (last minute)");
      
      if (returnRawResponse) {
        console.log("ZohoService: Returning raw cached response with isCached=true");
        
        // Make sure to mark it as cached
        const cachedResponse = {
          ...lastApiRequest.response,
          cached: true,
          isCached: true
        };
        
        return cachedResponse;
      }
      
      // If using cached response with transactions, filter vendors
      if (lastApiRequest.response?.cached_transactions && Array.isArray(lastApiRequest.response.cached_transactions)) {
        console.log(`ZohoService: Returning ${lastApiRequest.response.cached_transactions.length} filtered cached transactions from memory`);
        
        // Add cached flag to the response
        const transactions = filterExcludedVendors(lastApiRequest.response.cached_transactions);
        // Mark the transactions as coming from cache
        transactions.forEach(tx => {
          tx.fromCache = true;
        });
        
        return transactions;
      }
      
      // Otherwise process the raw response
      const transactions = processRawTransactions(lastApiRequest.response);
      transactions.forEach(tx => {
        tx.fromCache = true;
      });
      
      console.log(`ZohoService: Returning ${transactions.length} processed transactions from memory cache`);
      return transactions;
    }
    
    console.log("ZohoService: Formatted Panama dates for webhook request:", {
      startDate: panamaStartDate.toString(),
      formattedStartDate,
      endDate: panamaEndDate.toString(),
      formattedEndDate,
      timezone: PANAMA_TIMEZONE
    });
    
    if (!forceRefresh) {
      console.log("ZohoService: Checking for cached data in Supabase");
    } else {
      console.log("ZohoService: Force refresh requested, will bypass cache");
    }
    
    // Call the Supabase edge function instead of make.com webhook directly
    console.log("ZohoService: Calling Supabase zoho-transactions edge function");
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
    
    console.log("ZohoService: Received data from Supabase function:", {
      hasData: !!data,
      isCached: !!data.cached || !!data.cache_hit,
      transactionCount: data.cached_transactions?.length || 'unknown',
      dataType: typeof data
    });
    
    // Cache this response to avoid redundant calls
    const isCached = !!data.cached || !!data.cache_hit;
    lastApiRequest = {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      timestamp: now,
      response: data,
      isCached
    };
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return data;
    }
    
    // If we received processed transactions directly, use those
    if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
      console.log("Received processed transactions directly from Supabase");
      const transactions = filterExcludedVendors(data);
      if (isCached) {
        transactions.forEach(tx => {
          tx.fromCache = true;
        });
      }
      return transactions;
    }
    
    // If we received the processed webhook response, use the cached_transactions field
    if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
      console.log("Using processed transactions from response");
      const transactions = filterExcludedVendors(data.cached_transactions);
      if (isCached) {
        transactions.forEach(tx => {
          tx.fromCache = true;
        });
      }
      return transactions;
    }
    
    // Otherwise, process the raw webhook response
    const transactions = processRawTransactions(data);
    if (isCached) {
      transactions.forEach(tx => {
        tx.fromCache = true;
      });
    }
    return transactions;
  } catch (err) {
    handleApiError(err, 'Failed to connect to Supabase function');
    // Fall back to mock data
    console.warn('Falling back to mock data due to exception');
    return returnRawResponse ? { error: err instanceof Error ? err.message : 'Unknown error', raw_response: null } : getMockTransactions(startDate, endDate);
  }
};
