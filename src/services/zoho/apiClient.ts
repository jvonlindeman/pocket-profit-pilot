
import { Transaction } from "../../types/financial";
import { ensureValidDateFormat, handleApiError, processTransactionData } from "./utils";
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
    
    if (!data) {
      console.log("No transactions returned from Supabase function, using mock data");
      return returnRawResponse ? { message: "No data returned", data: null } : getMockTransactions(startDate, endDate);
    }
    
    console.log("ZohoService: Received data from Supabase function:", data);
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return data;
    }
    
    return processRawTransactions(data);
  } catch (err) {
    handleApiError(err, 'Failed to connect to Supabase function');
    // Fall back to mock data
    console.warn('Falling back to mock data due to exception');
    return returnRawResponse ? { error: err instanceof Error ? err.message : 'Unknown error' } : getMockTransactions(startDate, endDate);
  }
};

// Helper function to process raw transaction data from the API into the Transaction type
const processRawTransactions = (data: any): Transaction[] => {
  if (!data) {
    console.error("No data received from webhook");
    return [];
  }
  
  const result: Transaction[] = [];
  
  // Process Stripe income if available (new format)
  if (data.stripe) {
    try {
      // Parse the string to a number, handling comma as decimal separator
      const stripeAmount = parseFloat(data.stripe.replace(".", "").replace(",", "."));
      if (!isNaN(stripeAmount) && stripeAmount > 0) {
        result.push({
          id: `stripe-income-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: stripeAmount,
          description: 'Ingresos de Stripe',
          category: 'Ingresos por plataforma',
          source: 'Stripe',
          type: 'income'
        });
      }
    } catch (e) {
      console.error("Error processing Stripe income:", e);
    }
  }
  
  // Process collaborator expenses (new format)
  if (Array.isArray(data.colaboradores)) {
    data.colaboradores.forEach((item: any) => {
      if (item && item.total && item.vendor_name) {
        const amount = Number(item.total);
        if (amount > 0) {
          result.push({
            id: `colaborador-${item.vendor_name.replace(/\s/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: new Date().toISOString().split('T')[0],
            amount,
            description: `Pago a colaborador: ${item.vendor_name}`,
            category: 'Pagos a colaboradores',
            source: 'Zoho',
            type: 'expense'
          });
        }
      }
    });
  }
  
  // Process regular expenses (new format)
  if (Array.isArray(data.expenses)) {
    data.expenses.forEach((item: any) => {
      if (item && item.total !== undefined && item.total !== null) {
        const amount = Number(item.total);
        if (amount > 0) {
          result.push({
            id: `expense-${(item.vendor_name || item.account_name || '').replace(/\s/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: item.date || new Date().toISOString().split('T')[0],
            amount,
            description: item.vendor_name 
              ? `Pago a ${item.vendor_name}` 
              : `${item.account_name || 'Gasto'}`,
            category: item.account_name || 'Gastos generales',
            source: 'Zoho',
            type: 'expense'
          });
        }
      }
    });
  }
  
  // Process payments (income) (new format)
  if (Array.isArray(data.payments)) {
    data.payments.forEach((item: any) => {
      if (item && item.amount !== undefined && item.amount !== null && item.customer_name) {
        const amount = Number(item.amount);
        if (amount > 0) {
          result.push({
            id: `income-${item.customer_name.replace(/\s/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: item.date || new Date().toISOString().split('T')[0],
            amount,
            description: `Ingreso de ${item.customer_name}`,
            category: 'Ingresos',
            source: 'Zoho',
            type: 'income'
          });
        }
      }
    });
  }
  
  // Sort by date (newer first)
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
