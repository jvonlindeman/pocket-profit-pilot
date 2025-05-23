
import { supabase } from "../../integrations/supabase/client";
import { Transaction } from "../../types/financial";

/**
 * Fetch transactions from webhook directly without using database cache
 */
export async function fetchTransactionsFromWebhook(
  startDate: Date,
  endDate: Date,
  forceRefresh = false,
  rawResponse = false
): Promise<Transaction[] | any> {
  try {
    console.log(`Fetching Zoho transactions from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get the formatted start and end dates
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Call the edge function directly
    const { data, error } = await supabase.functions.invoke("zoho-transactions", {
      body: {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        forceRefresh,
        rawResponse
      }
    });
    
    if (error) {
      console.error("Error invoking zoho-transactions function:", error);
      throw error;
    }
    
    if (!data) {
      console.warn("No data returned from zoho-transactions function");
      return rawResponse ? { error: "No data returned" } : [];
    }
    
    // Return the raw response if requested
    if (rawResponse) {
      return data;
    }
    
    // Return the processed transactions
    return data.transactions || [];
  } catch (error) {
    console.error("Error in fetchTransactionsFromWebhook:", error);
    if (rawResponse) {
      return { error: error.message || "Unknown error" };
    }
    throw error;
  }
}
