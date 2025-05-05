
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
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
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
const processRawTransactions = (data: any[]): Transaction[] => {
  if (!Array.isArray(data)) {
    console.error("Expected array from webhook, received:", typeof data);
    return [];
  }
  
  const result: Transaction[] = [];
  
  // Process the data based on the structure
  data.forEach((item: any, index: number) => {
    // Check if the item is an array - this would be the income transactions or bill payments
    if (Array.isArray(item)) {
      // Handle different array types based on their contents
      
      // Check if this is the income transactions array (items have customer_name and amount)
      const isIncomeArray = item.length > 0 && item[0] && item[0].customer_name !== undefined && item[0].amount !== undefined;
      
      // Check if this is the bill payments array (items have vendor_name and total)
      const isBillArray = item.length > 0 && item[0] && item[0].vendor_name !== undefined && item[0].total !== undefined;

      if (isIncomeArray) {
        // Process income transactions
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
      } else if (isBillArray) {
        // Process bill payments
        item.forEach((billItem: any) => {
          if (billItem && billItem.total !== null && billItem.total !== undefined && billItem.vendor_name) {
            const amount = Math.abs(Number(billItem.total) || 0);
            
            if (amount > 0) {
              result.push({
                id: `bill-payment-${billItem.vendor_name.replace(/\s/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                date: new Date().toISOString().split('T')[0],
                amount,
                description: `Pago a ${billItem.vendor_name}`,
                category: billItem.vendor_name.includes("EMPLEADO") || 
                       billItem.vendor_name.includes("CONTRATISTA") || 
                       billItem.vendor_name.includes("NOMINA") ? 
                        'Pagos a personal' : 'Pagos a proveedores',
                source: 'Zoho',
                type: 'expense'
              });
            }
          }
        });
      }
    } else if (item && typeof item === 'object') {
      // This could be either an expense (with vendor_name) or a bill
      const isExpense = item.vendor_name !== undefined;
      const isBill = item.bill_number !== undefined;
      
      // Amount field can be in different locations based on the item type
      let amount = 0;
      if (isExpense && item.total !== null && item.total !== undefined) {
        amount = Math.abs(Number(item.total) || 0);
      } else if (isBill && item.balance !== null && item.balance !== undefined) {
        amount = Math.abs(Number(item.balance) || 0);
      } else if (item.total !== null && item.total !== undefined) {
        amount = Math.abs(Number(item.total) || 0);
      }
      
      // Only add the item if it has an amount
      if (amount > 0) {
        // Generate a description based on transaction type
        let description = 'Sin descripción';
        let category = 'Gastos generales';
        
        if (isExpense && item.vendor_name) {
          description = `Pago a ${item.vendor_name}`;
          category = item.vendor_name || 'Gastos generales';
          if (item.vendor_name.includes("EMPLEADO") || 
              item.vendor_name.includes("CONTRATISTA") || 
              item.vendor_name.includes("NOMINA")) {
            category = 'Pagos a personal';
          }
        } else if (isBill && item.vendor_name) {
          description = `Factura #${item.bill_number} de ${item.vendor_name}`;
          category = 'Facturas de proveedores';
        } else {
          description = 'Transacción';
        }
        
        // Generate a unique ID based on type
        const id = `${isExpense ? 'expense' : (isBill ? 'bill' : 'other')}-${
          item.vendor_name || item.bill_number || 'unknown'
        }-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        result.push({
          id,
          date: new Date().toISOString().split('T')[0],
          amount,
          description,
          category,
          source: 'Zoho',
          type: 'expense' // All vendor payments and bills are expenses
        });
      }
    }
  });
  
  // Sort by date (newer first)
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
