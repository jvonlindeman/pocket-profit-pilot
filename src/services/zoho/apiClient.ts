import { Transaction } from "../../types/financial";
import { ensureValidDateFormat, handleApiError } from "./utils";
import { getMockTransactions } from "./mockData";
import { supabase } from "@/integrations/supabase/client";

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

// Transform database records to Transaction objects
const transformCachedToTransaction = (cachedData: any[]): Transaction[] => {
  return cachedData.map(tx => ({
    id: tx.id,
    date: tx.date,
    amount: Number(tx.amount),
    description: tx.description || '',
    category: tx.category,
    source: normalizeSource(tx.source),
    type: normalizeType(tx.type)
  }));
};

// Check if cache is fresh (less than specified hours old)
const isCacheFresh = (cachedData: any[], maxHoursOld = 1): boolean => {
  if (!cachedData || cachedData.length === 0) return false;
  
  const latestSync = new Date(Math.max(...cachedData.map(tx => new Date(tx.sync_date).getTime())));
  const cacheAge = Date.now() - latestSync.getTime();
  const cacheAgeHours = cacheAge / (1000 * 60 * 60);
  
  console.log(`ZohoService: Cache age: ${cacheAgeHours.toFixed(2)} hours`);
  
  return cacheAgeHours < maxHoursOld;
};

// Check if cache covers the entire date range
const cacheCoversDateRange = (cachedData: any[], startDate: string, endDate: string): boolean => {
  if (!cachedData || cachedData.length === 0) return false;
  
  // Get the earliest and latest dates in the cache
  const cachedDates = cachedData.map(tx => tx.date);
  const earliestCachedDate = new Date(Math.min(...cachedDates.map(d => new Date(d).getTime())));
  const latestCachedDate = new Date(Math.max(...cachedDates.map(d => new Date(d).getTime())));
  
  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);
  
  // Check if cache covers the entire range
  const covered = earliestCachedDate <= requestStart && latestCachedDate >= requestEnd;
  
  console.log(`ZohoService: Cache coverage check - Range ${startDate} to ${endDate}:`, 
    covered ? "Complete coverage" : "Incomplete coverage");
  
  return covered;
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
    
    // Check for cached data directly unless forceRefresh is true
    if (!forceRefresh) {
      console.log("ZohoService: Checking for cached data first");
      const { data: cachedData, error: cacheError } = await supabase
        .from("cached_transactions")
        .select("*")
        .gte("date", formattedStartDate)
        .lte("date", formattedEndDate);
        
      if (!cacheError && cachedData && cachedData.length > 0) {
        console.log("ZohoService: Found cached data, found", cachedData.length, "transactions");
        
        // Check if the cache is fresh and covers the entire date range
        const isFresh = isCacheFresh(cachedData);
        const fullCoverage = cacheCoversDateRange(cachedData, formattedStartDate, formattedEndDate);
        
        if (isFresh && fullCoverage) {
          console.log("ZohoService: Using fresh and complete cache data");
          
          if (returnRawResponse) {
            return { 
              cached: true, 
              fromCache: true,
              data: cachedData 
            };
          }
          
          return transformCachedToTransaction(cachedData);
        }
        
        console.log(`ZohoService: Cache ${!isFresh ? 'is stale' : ''} ${!fullCoverage ? 'has incomplete coverage' : ''}, fetching fresh data`);
      } else {
        console.log("ZohoService: No cached data found or cache error:", cacheError);
      }
    } else {
      console.log("ZohoService: Force refresh requested, bypassing cache");
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
      
      // If we get an error, check if we have cached data as fallback
      if (!forceRefresh) {
        const { data: fallbackCache } = await supabase
          .from("cached_transactions")
          .select("*")
          .gte("date", formattedStartDate)
          .lte("date", formattedEndDate);
          
        if (fallbackCache && fallbackCache.length > 0) {
          console.log("ZohoService: Using cached data as fallback after API error");
          if (returnRawResponse) {
            return { 
              cached: true, 
              fromCache: true,
              error: error.message,
              data: fallbackCache 
            };
          }
          
          return transformCachedToTransaction(fallbackCache);
        }
      }
      
      const errorMessage = handleApiError({details: error.message}, 'Failed to fetch Zoho transactions from Supabase cache');
      console.warn('Falling back to mock data due to error');
      return returnRawResponse ? { error: error.message, raw_response: null } : getMockTransactions(startDate, endDate);
    }
    
    if (!data) {
      console.log("No transactions returned from Supabase function, using mock data");
      return returnRawResponse ? { message: "No data returned", data: null, raw_response: null } : getMockTransactions(startDate, endDate);
    }
    
    console.log("ZohoService: Received data from Supabase function:", 
      data.fromCache ? "From Cache" : "Fresh data from webhook");
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return data;
    }
    
    // If we received processed transactions directly, use those
    if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
      console.log("Received processed transactions directly from Supabase");
      return transformCachedToTransaction(data);
    }
    
    // If we received the processed webhook response, use the cached_transactions field
    if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
      console.log("Using processed transactions from response");
      return transformCachedToTransaction(data.cached_transactions);
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
  
  // Process collaborator expenses (new format with proper array) - Ahora con fechas
  if (Array.isArray(data.colaboradores)) {
    data.colaboradores.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.vendor_name) {
        const amount = Number(item.total);
        if (amount > 0) {
          // Usar la fecha del colaborador si está disponible, o la fecha actual
          const collaboratorDate = item.date || new Date().toISOString().split('T')[0];
          
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
