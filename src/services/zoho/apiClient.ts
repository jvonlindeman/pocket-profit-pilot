
import { Transaction } from "../../types/financial";
import { ensureValidDateFormat, handleApiError } from "./utils";
import { getMockTransactions } from "./mockData";
import { supabase } from "@/integrations/supabase/client";

// Format date in YYYY-MM-DD format without timezone shifts
const formatDateYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const isCurrentMonth = (earliestCachedDate.getMonth() === today.getMonth() && 
                         earliestCachedDate.getFullYear() === today.getFullYear());
  const freshnessPeriod = isCurrentMonth ? 1 : maxHoursOld;
  
  console.log(`ZohoService: Cache age: ${cacheAgeHours.toFixed(2)} hours, freshness threshold: ${freshnessPeriod} hours`);
  
  return cacheAgeHours < freshnessPeriod;
};

// Improved cache coverage check with more lenient matching
const cacheCoversDateRange = (cachedData: any[], startDate: string, endDate: string): boolean => {
  if (!cachedData || cachedData.length === 0) return false;
  
  // Get the earliest and latest dates in the cache
  const cachedDates = cachedData.map(tx => new Date(tx.date));
  const earliestCachedDate = new Date(Math.min(...cachedDates.map(date => date.getTime())));
  const latestCachedDate = new Date(Math.max(...cachedDates.map(date => date.getTime())));
  
  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);
  
  // Check if the cache spans the entire requested date range
  // Be more lenient - allow 1 day difference on each end
  const oneDayMs = 24 * 60 * 60 * 1000;
  const spansDateRange = 
    (earliestCachedDate <= new Date(requestStart.getTime() + oneDayMs)) && 
    (latestCachedDate >= new Date(requestEnd.getTime() - oneDayMs));
  
  // Also check if we have a reasonable sample of different transaction types
  const hasIncomeTransactions = cachedData.some(tx => tx.type === 'income');
  const hasExpenseTransactions = cachedData.some(tx => tx.type === 'expense');
  const hasZohoTransactions = cachedData.some(tx => tx.source === 'Zoho');
  
  // Log coverage details for debugging
  console.log(`ZohoService: Cache coverage check - Range ${startDate} to ${endDate}:`, {
    spansDateRange,
    transactionCount: cachedData.length,
    hasIncomeTransactions,
    hasExpenseTransactions,
    hasZohoTransactions,
    earliestCachedDate: earliestCachedDate.toISOString().split('T')[0],
    latestCachedDate: latestCachedDate.toISOString().split('T')[0],
    requestStartDate: requestStart.toISOString().split('T')[0], 
    requestEndDate: requestEnd.toISOString().split('T')[0]
  });
  
  // We consider the cache complete if:
  // 1. It approximately spans the date range OR we have a substantial number of transactions 
  // 2. We have a good mix of transaction types
  const hasGoodCoverage = (spansDateRange || cachedData.length > 30) && 
                         hasIncomeTransactions && 
                         hasExpenseTransactions && 
                         hasZohoTransactions;
  
  console.log(`ZohoService: Cache coverage result: ${hasGoodCoverage ? "Complete coverage" : "Incomplete coverage"}`);
  
  return hasGoodCoverage;
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
    
    // Fix any dates in the future (wrong year)
    const currentYear = new Date().getFullYear();
    if (startDate.getFullYear() > currentYear) {
      console.log(`ZohoService: Correcting future year in startDate: ${startDate.toISOString()}`);
      startDate.setFullYear(currentYear);
    }
    
    if (endDate.getFullYear() > currentYear) {
      console.log(`ZohoService: Correcting future year in endDate: ${endDate.toISOString()}`);
      endDate.setFullYear(currentYear);
    }
    
    // Log exact date objects for debugging
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
              data: cachedData,
              cachedTransactionCount: cachedData.length,
              dateRange: {
                startDate: formattedStartDate,
                endDate: formattedEndDate
              }
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
    
    // Call the Supabase edge function with proper forceRefresh parameter and our explicitly formatted dates
    console.log("ZohoService: Calling Supabase edge function with formatted dates and forceRefresh =", forceRefresh);
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
              data: fallbackCache,
              cachedTransactionCount: fallbackCache.length,
              dateRange: {
                startDate: formattedStartDate,
                endDate: formattedEndDate
              }
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
      data.fromCache ? "From Cache" : "Fresh data from webhook", 
      data.cached_transactions ? `with ${data.cached_transactions.length} transactions` : "");
    
    // Return raw response for debugging if requested
    if (returnRawResponse) {
      return {
        ...data,
        dateRange: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      };
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
