
import { Transaction } from "../../types/financial";
import { ensureValidDateFormat, handleApiError } from "./utils";
import { getMockTransactions } from "./mockData";
import { supabase } from "@/integrations/supabase/client";
import { parseDate } from "@/lib/utils";

// Format date in YYYY-MM-DD format without timezone shifts
const formatDateYYYYMMDD = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Helper function to ensure source is either 'Zoho' or 'Stripe'
const normalizeSource = (source: string): 'Zoho' | 'Stripe' => {
  return source === 'Stripe' ? 'Stripe' : 'Zoho';
};

// Helper function to normalize transaction type
const normalizeType = (type: string): 'income' | 'expense' => {
  return type === 'income' ? 'income' : 'expense';
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
    
    if (!forceRefresh) {
      console.log("ZohoService: No longer checking for cached data, feature removed");
    } else {
      console.log("ZohoService: Force refresh requested");
    }
    
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
      
      // If we get an error, use mock data
      const errorMessage = handleApiError({details: error.message}, 'Failed to fetch Zoho transactions from Supabase cache');
      console.warn('Falling back to mock data due to error');
      return returnRawResponse ? { error: error.message, raw_response: null } : getMockTransactions(startDate, endDate);
    }
    
    if (!data) {
      console.log("No transactions returned from Supabase function, using mock data");
      return returnRawResponse ? { message: "No data returned", data: null, raw_response: null } : getMockTransactions(startDate, endDate);
    }
    
    console.log("ZohoService: Received data from Supabase function");
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return data;
    }
    
    // If we received processed transactions directly, use those
    if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
      console.log("Received processed transactions directly from Supabase");
      return data;
    }
    
    // If we received the processed webhook response, use the cached_transactions field
    if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
      console.log("Using processed transactions from response");
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
        const today = new Date().toISOString().split('T')[0];
        result.push({
          id: `stripe-income-${today}-${stripeAmount}`,
          date: today,
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
  
  // Process collaborator expenses (new format with proper array) - with improved date handling
  if (Array.isArray(data.colaboradores)) {
    data.colaboradores.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.vendor_name) {
        const amount = Number(item.total);
        if (amount > 0) {
          // Enhanced date handling for collaborator transactions
          let collaboratorDate: string;
          
          if (item.date) {
            // Log raw date field from API
            console.log(`Raw collaborator date for ${item.vendor_name}:`, item.date);
            
            // Ensure we have a valid YYYY-MM-DD format
            try {
              // Try to parse and format the date
              const parsedDate = parseDate(item.date);
              collaboratorDate = formatDateYYYYMMDD(parsedDate);
              console.log(`Processed collaborator date for ${item.vendor_name}:`, collaboratorDate);
            } catch (err) {
              console.error(`Error parsing collaborator date for ${item.vendor_name}:`, err);
              collaboratorDate = new Date().toISOString().split('T')[0];
            }
          } else {
            console.log(`No date provided for collaborator ${item.vendor_name}, using current date`);
            collaboratorDate = new Date().toISOString().split('T')[0];
          }
          
          result.push({
            id: `colaborador-${item.vendor_name.replace(/\s/g, '-')}-${collaboratorDate}-${amount}`,
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
          const expenseDate = item.date || new Date().toISOString().split('T')[0];
          const vendorName = item.vendor_name || '';
          const accountName = item.account_name || 'Gastos generales';
          
          result.push({
            id: `expense-${(vendorName || accountName || '').replace(/\s/g, '-')}-${expenseDate}-${amount}`,
            date: expenseDate,
            amount,
            description: vendorName 
              ? `Pago a ${vendorName}` 
              : `${accountName}`,
            category: accountName,
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
          const paymentDate = item.date || new Date().toISOString().split('T')[0];
          const customerName = item.customer_name;
          const invoiceId = item.invoice_id || '';
          
          result.push({
            id: `income-${customerName.replace(/\s/g, '-')}-${paymentDate}-${invoiceId || index}`,
            date: paymentDate,
            amount,
            description: `Ingreso de ${customerName}`,
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
