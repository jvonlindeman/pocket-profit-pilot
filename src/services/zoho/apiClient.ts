
import { Transaction } from "../../types/financial";
import { handleApiError } from "./utils";
import { getMockTransactions, getMockZohoWebhookResponse } from "./mockData";
import { supabase } from "../../integrations/supabase/client";
import { PANAMA_TIMEZONE } from "../../utils/timezoneUtils";
import { processRawTransactions, filterExcludedVendors } from "./api/processor";
import { preparePanamaDates } from "./api/formatter";

// Function to call the Supabase edge function which handles requests
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
    
    // Call the Supabase edge function directly to get transactions
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
      const errorMessage = handleApiError({details: error.message}, 'Failed to fetch Zoho transactions');
      console.warn('Falling back to mock data due to error');
      
      // Use more complete mock data that includes facturas_sin_pagar
      const mockData = await getMockZohoWebhookResponse(panamaStartDate, panamaEndDate);
      return returnRawResponse ? mockData : processRawTransactions(mockData);
    }
    
    if (!data) {
      console.log("No transactions returned from Supabase function, using mock data");
      
      // Use more complete mock data that includes facturas_sin_pagar
      const mockData = await getMockZohoWebhookResponse(panamaStartDate, panamaEndDate);
      return returnRawResponse ? mockData : processRawTransactions(mockData);
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
    
    // Use more complete mock data that includes facturas_sin_pagar
    const mockData = await getMockZohoWebhookResponse(startDate, endDate);
    return returnRawResponse ? mockData : processRawTransactions(mockData);
  }
};
