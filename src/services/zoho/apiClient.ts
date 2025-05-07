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

// Check if cache is fresh based on how old the data is and whether it's current or historical
const isCacheFresh = (cachedData: any[], maxHoursOld = 24): boolean => {
  if (!cachedData || cachedData.length === 0) return false;
  
  const latestSync = new Date(Math.max(...cachedData.map(tx => new Date(tx.sync_date).getTime())));
  const cacheAge = Date.now() - latestSync.getTime();
  const cacheAgeHours = cacheAge / (1000 * 60 * 60);
  
  // Check if we're looking at current month data
  const today = new Date();
  const earliestCachedDate = new Date(Math.min(...cachedData.map(tx => new Date(tx.date).getTime())));
  
  // For current month data, use 1 hour; for historical data, use maxHoursOld (default 24 hours)
  const freshnessPeriod = (earliestCachedDate.getMonth() === today.getMonth() && 
                           earliestCachedDate.getFullYear() === today.getFullYear()) 
                           ? 1 : maxHoursOld;
  
  console.log(`ZohoService: Cache age: ${cacheAgeHours.toFixed(2)} hours, freshness threshold: ${freshnessPeriod} hours`);
  
  return cacheAgeHours < freshnessPeriod;
};

// Improved cache coverage check
const cacheCoversDateRange = (cachedData: any[], startDate: string, endDate: string): boolean => {
  if (!cachedData || cachedData.length === 0) return false;
  
  // Get the earliest and latest dates in the cache
  const cachedDates = cachedData.map(tx => new Date(tx.date));
  const earliestCachedDate = new Date(Math.min(...cachedDates.map(date => date.getTime())));
  const latestCachedDate = new Date(Math.max(...cachedDates.map(date => date.getTime())));
  
  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);
  
  // Check if the cache spans the entire requested date range
  const spansDateRange = earliestCachedDate <= requestStart && latestCachedDate >= requestEnd;
  
  // Also check if we have a reasonable sample of different transaction types
  const hasIncomeTransactions = cachedData.some(tx => tx.type === 'income');
  const hasExpenseTransactions = cachedData.some(tx => tx.type === 'expense');
  const hasZohoTransactions = cachedData.some(tx => tx.source === 'Zoho');
  const hasStripeTransactions = cachedData.some(tx => tx.source === 'Stripe');
  
  // Log coverage details for debugging
  console.log(`ZohoService: Cache coverage check - Range ${startDate} to ${endDate}:`, {
    spansDateRange,
    transactionCount: cachedData.length,
    hasIncomeTransactions,
    hasExpenseTransactions,
    hasZohoTransactions,
    hasStripeTransactions,
    earliestCachedDate: earliestCachedDate.toISOString().split('T')[0],
    latestCachedDate: latestCachedDate.toISOString().split('T')[0],
    requestStartDate: requestStart.toISOString().split('T')[0], 
    requestEndDate: requestEnd.toISOString().split('T')[0]
  });
  
  // We consider the cache complete if it spans the date range and has representative transaction types
  // For old months we won't be too strict about having stripe data since it might not be relevant
  const isCurrentMonth = (requestStart.getMonth() === new Date().getMonth() && 
                          requestStart.getFullYear() === new Date().getFullYear());
                          
  const hasGoodCoverage = spansDateRange && 
                         hasIncomeTransactions && 
                         hasExpenseTransactions && 
                         hasZohoTransactions &&
                         (hasStripeTransactions || !isCurrentMonth || cachedData.length > 10);
  
  const covered = hasGoodCoverage;
  
  console.log(`ZohoService: Cache coverage result: ${covered ? "Complete coverage" : "Incomplete coverage"}`);
  
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
    console.log("ZohoService: Fetching transactions from", startDate, "to", endDate, 
      forceRefresh ? "with force refresh" : "using cache if available");
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
      formattedEndDate,
      forceRefresh: forceRefresh
    });
    
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
        const isFresh = isCacheFresh(cachedData, 24); // Use 24 hours as default freshness period
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
    
    // Call the Supabase edge function with proper forceRefresh parameter
    console.log("ZohoService: Calling Supabase edge function with forceRefresh =", forceRefresh);
    const { data, error } = await supabase.functions.invoke("zoho-transactions", {
      body: {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        forceRefresh: forceRefresh
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
    
    // Use the processed transactions provided by the edge function
    if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
      console.log("Using processed transactions from response");
      return transformCachedToTransaction(data.cached_transactions);
    }
    
    // If we have data in the expected format, use it
    if (Array.isArray(data) && data.length > 0 && 'type' in data[0] && 'source' in data[0]) {
      console.log("Received transactions directly from Supabase");
      return transformCachedToTransaction(data);
    }
    
    // If response contains cached data, use it
    if (data.data && Array.isArray(data.data)) {
      console.log("Using data from response");
      return transformCachedToTransaction(data.data);
    }
    
    // If all else fails, use mock data
    console.warn('No valid transactions in response, falling back to mock data');
    return getMockTransactions(startDate, endDate);
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
