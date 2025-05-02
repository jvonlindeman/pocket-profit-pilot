
import { Transaction } from "../../types/financial";
import { ensureValidDateFormat, handleApiError } from "./utils";
import { getMockTransactions } from "./mockData";
import { supabase } from "@/integrations/supabase/client";

// The make.com webhook URL - kept as fallback if necessary
const makeWebhookUrl = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

// Function to call the Supabase edge function which handles caching
export const fetchTransactionsFromWebhook = async (
  startDate: Date, 
  endDate: Date, 
  forceRefresh = false,
  returnRawResponse = false
): Promise<Transaction[] | any> => {
  try {
    console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
    
    // Format dates for the API (YYYY-MM-DD format)
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    console.log("ZohoService: Calling Supabase edge function for cached transactions");
    
    // Call the Supabase edge function instead of make.com webhook directly
    const { data, error } = await supabase.functions.invoke("zoho-transactions", {
      body: {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        forceRefresh
      }
    });
    
    if (error) {
      console.error("Failed to fetch data from Supabase function:", error);
      
      const errorMessage = handleApiError({details: error.message}, 'Failed to fetch Zoho transactions from Supabase cache');
      console.warn('Falling back to mock data due to error');
      return returnRawResponse ? { error: error.message } : getMockTransactions(startDate, endDate);
    }
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.log("No transactions returned from Supabase function, using mock data");
      return returnRawResponse ? { message: "No data returned", data: null } : getMockTransactions(startDate, endDate);
    }
    
    console.log("ZohoService: Received data from Supabase function:", data);
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return data;
    }
    
    return processTransactionData(data);
  } catch (err) {
    handleApiError(err, 'Failed to connect to Supabase function');
    // Fall back to mock data
    console.warn('Falling back to mock data due to exception');
    return returnRawResponse ? { error: err instanceof Error ? err.message : 'Unknown error' } : getMockTransactions(startDate, endDate);
  }
};

// Helper function to process and normalize transaction data
const processTransactionData = (data: any[]): Transaction[] => {
  if (!Array.isArray(data)) {
    console.error("Expected array from webhook, received:", typeof data);
    return [];
  }
  
  return data.map((item: any) => {
    // Determine if this is an income or expense transaction
    // If vendor_name is present, it's an expense; if customer_name is present, it's income
    const transactionType = item.vendor_name ? 'expense' : 'income';
    
    // Set appropriate description based on transaction type
    let description = 'Sin descripción';
    if (transactionType === 'income' && item.customer_name) {
      description = `Ingreso de ${item.customer_name}`;
    } else if (transactionType === 'expense' && item.vendor_name) {
      description = `Pago a ${item.vendor_name}`;
    }
    
    // Map the external_id from Supabase to id if it exists, otherwise use id or generate one
    const id = item.external_id || item.id || `zoho-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Ensure the item has all required fields
    return {
      id,
      date: item.date ? ensureValidDateFormat(item.date) : new Date().toISOString().split('T')[0],
      amount: Math.abs(Number(item.amount) || 0),  // Ensure amount is positive
      description: item.description || description,
      category: item.category || (transactionType === 'expense' ? 'Gastos generales' : 'Ingresos'),
      source: 'Zoho',
      type: transactionType
    } as Transaction;
  });
};
