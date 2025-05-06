import { Transaction } from "../../types/financial";
import { ensureValidDateFormat, handleApiError } from "./utils";
import { getMockTransactions } from "./mockData";
import { supabase } from "@/integrations/supabase/client";

// The make.com webhook URL - kept as fallback if necessary
const makeWebhookUrl = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

// Format date in YYYY-MM-DD format without timezone shifts
const formatDateYYYYMMDD = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    console.log("ZohoService: Raw date objects:", {
      startDateObj: startDate,
      startDateType: typeof startDate,
      endDateObj: endDate,
      endDateType: typeof endDate
    });
    
    // Format dates using our custom formatter to avoid timezone shifts
    const formattedStartDate = formatDateYYYYMMDD(startDate);
    const formattedEndDate = formatDateYYYYMMDD(endDate);
    
    console.log("ZohoService: Formatted dates for webhook request:", {
      startDate: startDate,
      formattedStartDate,
      endDate: endDate,
      formattedEndDate
    });
    
    console.log("ZohoService: Calling Supabase edge function with exact dates:", formattedStartDate, formattedEndDate);
    
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
      return returnRawResponse ? { error: error.message, raw_response: null } : getMockTransactions(startDate, endDate);
    }
    
    if (!data) {
      console.log("No transactions returned from Supabase function, using mock data");
      return returnRawResponse ? { message: "No data returned", data: null, raw_response: null } : getMockTransactions(startDate, endDate);
    }
    
    console.log("ZohoService: Received data from Supabase function:", data);
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return data;
    }
    
    // Check if we received cached transactions directly
    if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
      console.log("Received cached transactions directly from Supabase");
      
      // Convert the cached transactions to our Transaction type
      return data.map((tx: any) => ({
        id: tx.id,
        date: tx.date,
        amount: Number(tx.amount),
        description: tx.description || '',
        category: tx.category,
        source: tx.source,
        type: tx.type
      }));
    }
    
    // If we received the processed webhook response, use the cached_transactions field
    if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
      console.log("Using newly processed cached transactions");
      return data.cached_transactions;
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

// Helper function to process raw transaction data from the API into the Transaction type
const processRawTransactions = (data: any): Transaction[] => {
  if (!data) {
    console.error("No data received from webhook");
    return [];
  }
  
  const result: Transaction[] = [];
  
  // If we received a raw_response instead of structured data, log it but return empty array
  if (data.raw_response && (!data.stripe && !data.colaboradores && !data.expenses && !data.payments)) {
    console.error("Received raw_response but no structured data:", data.raw_response);
    return [];
  }
  
  // Process Stripe income if available (new format)
  if (data.stripe) {
    try {
      // Parse the string to a number, handling comma as decimal separator
      const stripeAmount = parseFloat(String(data.stripe).replace(".", "").replace(",", "."));
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
  
  // Process collaborator expenses (new format with proper array) - Ahora con fechas
  if (Array.isArray(data.colaboradores)) {
    data.colaboradores.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.vendor_name) {
        const amount = Number(item.total);
        if (amount > 0) {
          // Usar la fecha del colaborador si está disponible, o la fecha actual
          const collaboratorDate = item.date || new Date().toISOString().split('T')[0];
          
          result.push({
            id: `colaborador-${item.vendor_name.replace(/\s/g, '-')}-${Date.now()}-${index}`,
            date: collaboratorDate,
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
  
  // Process regular expenses (new format with proper array)
  // Filter out expenses with category "Impuestos"
  if (Array.isArray(data.expenses)) {
    data.expenses.forEach((item: any, index: number) => {
      // Skip expenses with account_name "Impuestos"
      if (item && typeof item.total !== 'undefined' && item.account_name !== "Impuestos") {
        const amount = Number(item.total);
        if (amount > 0) {
          result.push({
            id: `expense-${(item.vendor_name || item.account_name || '').replace(/\s/g, '-')}-${Date.now()}-${index}`,
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
  
  // Process payments (income) (new format with proper array)
  if (Array.isArray(data.payments)) {
    data.payments.forEach((item: any, index: number) => {
      if (item && typeof item.amount !== 'undefined' && item.customer_name) {
        const amount = Number(item.amount);
        if (amount > 0) {
          result.push({
            id: `income-${item.customer_name.replace(/\s/g, '-')}-${Date.now()}-${index}`,
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
