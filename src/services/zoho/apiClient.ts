
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
  
  const result: Transaction[] = [];
  
  // Process the data based on the structure
  data.forEach((item: any, index: number) => {
    // Check if the item is an array - this would be the income transactions
    if (Array.isArray(item)) {
      // This is the income transactions array
      item.forEach((incomeItem: any) => {
        if (incomeItem && incomeItem.amount && incomeItem.customer_name) {
          result.push({
            id: `income-${incomeItem.customer_name.replace(/\s/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: new Date().toISOString().split('T')[0], // Using current date since it's not in the data
            amount: Number(incomeItem.amount) || 0,
            description: `Ingreso de ${incomeItem.customer_name}`,
            category: incomeItem.customer_name.includes("EMPLEADO") || incomeItem.customer_name.includes("CONTRATISTA") ? 
              'Pagos a personal' : 'Ingresos',
            source: 'Zoho',
            type: 'income'
          });
        }
      });
    } else if (item && typeof item === 'object') {
      // This is likely an expense item (with vendor_name)
      if (item.total !== null && item.total !== undefined) {
        const isExpense = item.vendor_name !== undefined;
        
        // Generate a description based on transaction type
        let description = 'Sin descripción';
        if (isExpense && item.vendor_name) {
          description = `Pago a ${item.vendor_name}`;
        } else {
          description = 'Transacción';
        }
        
        // Determine category - check if it's a contractor or employee payment
        let category = isExpense ? (item.vendor_name || 'Gastos generales') : 'Otros';
        if (isExpense && item.vendor_name && 
            (item.vendor_name.includes("EMPLEADO") || 
             item.vendor_name.includes("CONTRATISTA") || 
             item.vendor_name.includes("NOMINA"))) {
          category = 'Pagos a personal';
        }
        
        // Generate a unique ID
        const id = `${isExpense ? 'expense' : 'other'}-${item.vendor_name || 'unknown'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        result.push({
          id,
          date: new Date().toISOString().split('T')[0], // Using current date since it's not in the data
          amount: Math.abs(Number(item.total) || 0),
          description,
          category,
          source: 'Zoho',
          type: isExpense ? 'expense' : 'income'
        });
      }
    }
  });
  
  // Sort by date (newer first)
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
