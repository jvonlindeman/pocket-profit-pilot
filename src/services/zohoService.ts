
import { Transaction } from "../types/financial";
import { fetchTransactionsFromWebhook } from "./zoho/apiClient";
import { getMockTransactions } from "./zoho/mockData";
import { supabase } from "@/integrations/supabase/client";

// Variable para almacenar la última respuesta cruda del webhook
let lastRawResponse: any = null;

// Tracking cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  lastRefresh: new Date(),
  cachedRanges: {} as Record<string, Date> // Track which date ranges have been cached and when
};

// Helper function to normalize source to match Transaction type
const normalizeSource = (source: string): 'Zoho' | 'Stripe' => {
  return source === 'Stripe' ? 'Stripe' : 'Zoho';
};

// Helper function to normalize transaction type
const normalizeType = (type: string): 'income' | 'expense' => {
  return type === 'income' ? 'income' : 'expense';
};

// Helper to create a date range key for caching
const createDateRangeKey = (startDate: Date, endDate: Date): string => {
  const start = formatDateYYYYMMDD(startDate);
  const end = formatDateYYYYMMDD(endDate);
  return `${start}_${end}`;
};

// Format date in YYYY-MM-DD format without timezone shifts
const formatDateYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fix date to ensure it's in the correct year
const fixDateYear = (date: Date): Date => {
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() > currentYear) {
    const correctedDate = new Date(date);
    correctedDate.setFullYear(currentYear);
    console.log(`ZohoService: Corrected future date from ${date.toISOString()} to ${correctedDate.toISOString()}`);
    return correctedDate;
  }
  return date;
};

// Implementation that connects to Zoho Books API via make.com webhook
const ZohoService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date, forceRefresh = false): Promise<Transaction[]> => {
    try {
      console.log("ZohoService: Getting transactions for", startDate, "to", endDate, 
        forceRefresh ? "with force refresh" : "using cache if available");
      
      // Fix any dates that might be in the wrong year
      startDate = fixDateYear(startDate);
      endDate = fixDateYear(endDate);
      
      // Track the requested date range to know if we've fetched it before
      const rangeKey = createDateRangeKey(startDate, endDate);
      
      // Format dates for logging - explicit format to avoid timezone issues
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      console.log(`ZohoService: Formatted dates for cache lookup: ${formattedStartDate} to ${formattedEndDate}`);
      
      // First check if we have cached transactions in the database
      if (!forceRefresh) {
        try {
          const { data: cachedTransactions, error } = await supabase
            .from("cached_transactions")
            .select("*")
            .gte("date", formattedStartDate)
            .lte("date", formattedEndDate);
          
          if (!error && cachedTransactions && cachedTransactions.length > 0) {
            console.log(`ZohoService: Found ${cachedTransactions.length} cached transactions in database`);
            
            // Check if the data is recent enough based on the date range
            const currentMonth = new Date().getMonth() === startDate.getMonth() && 
                               new Date().getFullYear() === startDate.getFullYear();
            
            // For current month data, we use a shorter freshness window (2 hours)
            // For historical data, we use a longer freshness window (48 hours)
            const maxHoursOld = currentMonth ? 2 : 48;
            
            // Get the most recent sync date from cached transactions
            const latestSync = new Date(Math.max(...cachedTransactions.map(tx => 
              new Date(tx.sync_date).getTime())));
            
            const cacheAge = Date.now() - latestSync.getTime();
            const cacheAgeHours = cacheAge / (1000 * 60 * 60);
            
            console.log(`ZohoService: Cache age: ${cacheAgeHours.toFixed(2)} hours, freshness threshold: ${maxHoursOld} hours`);
            
            if (cacheAgeHours < maxHoursOld) {
              // Cache is fresh, use it
              console.log(`ZohoService: Using fresh cached data (${cacheAgeHours.toFixed(2)} hours old)`);
              
              // Update cache stats
              cacheStats.hits++;
              cacheStats.cachedRanges[rangeKey] = latestSync;
              
              // Transform cached data to Transaction type
              const normalizedTransactions: Transaction[] = cachedTransactions.map(tx => ({
                id: tx.id,
                date: tx.date,
                amount: Number(tx.amount),
                description: tx.description || '',
                category: tx.category,
                source: normalizeSource(tx.source),
                type: normalizeType(tx.type)
              }));
              
              // Store the last response for debugging
              lastRawResponse = {
                cached: true,
                fromCache: true,
                cachedTime: latestSync,
                data: cachedTransactions
              };
              
              return normalizedTransactions;
            } else {
              // Cache is stale, refresh in the background
              console.log(`ZohoService: Cache is stale (${cacheAgeHours.toFixed(2)} hours old > ${maxHoursOld}), refreshing`);
              
              // Return the stale data immediately but trigger a refresh in the background
              const normalizedTransactions: Transaction[] = cachedTransactions.map(tx => ({
                id: tx.id,
                date: tx.date,
                amount: Number(tx.amount),
                description: tx.description || '',
                category: tx.category,
                source: normalizeSource(tx.source),
                type: normalizeType(tx.type)
              }));
              
              // Trigger a background refresh
              setTimeout(() => {
                console.log("ZohoService: Starting background cache refresh");
                ZohoService.forceRefresh(startDate, endDate)
                  .then(() => console.log("ZohoService: Background refresh completed"))
                  .catch(err => console.error("ZohoService: Background refresh failed", err));
              }, 100);
              
              // Update cache stats
              cacheStats.hits++;
              
              // Store the last response for debugging
              lastRawResponse = {
                cached: true,
                fromCache: true,
                stale: true,
                cachedTime: latestSync,
                data: cachedTransactions
              };
              
              return normalizedTransactions;
            }
          } else {
            console.log("ZohoService: No cached transactions found in database or error:", error);
          }
        } catch (dbError) {
          console.error("ZohoService: Error checking database cache:", dbError);
        }
      }
      
      // No valid cache or force refresh, fetch from API
      cacheStats.misses++;
      cacheStats.lastRefresh = new Date();
      
      // Call the API client with the returnRawResponse option - pass explicitly formatted dates
      console.log("ZohoService: Fetching from API");
      const response = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      
      // Store the raw response for debugging
      if (response) {
        lastRawResponse = response;
      }
      
      // If this was successful, record the date range as cached
      if (response && !response.error) {
        cacheStats.cachedRanges[rangeKey] = new Date();
      }
      
      // Process the response based on its format
      if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
        console.log(`ZohoService: Using ${response.cached_transactions.length} transactions from response`);
        
        const normalizedTransactions: Transaction[] = response.cached_transactions.map(tx => ({
          id: tx.id,
          date: tx.date,
          amount: Number(tx.amount),
          description: tx.description || '',
          category: tx.category,
          source: normalizeSource(tx.source),
          type: normalizeType(tx.type)
        }));
        
        return normalizedTransactions;
      }
      
      // Check other possible response formats
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`ZohoService: Using ${response.data.length} transactions from response.data`);
        
        const normalizedTransactions: Transaction[] = response.data.map(tx => ({
          id: tx.id,
          date: tx.date,
          amount: Number(tx.amount),
          description: tx.description || '',
          category: tx.category,
          source: normalizeSource(tx.source),
          type: normalizeType(tx.type)
        }));
        
        return normalizedTransactions;
      }
      
      if (Array.isArray(response)) {
        console.log(`ZohoService: Using ${response.length} transactions from direct array response`);
        
        const normalizedTransactions: Transaction[] = response.map(tx => ({
          id: tx.id,
          date: tx.date,
          amount: Number(tx.amount),
          description: tx.description || '',
          category: tx.category,
          source: normalizeSource(tx.source),
          type: normalizeType(tx.type)
        }));
        
        return normalizedTransactions;
      }
      
      // If all else fails, use mock data
      console.warn("ZohoService: No transactions returned, using mock data");
      return getMockTransactions(startDate, endDate);
    } catch (error) {
      console.error("ZohoService: Error in getTransactions", error);
      cacheStats.errors++;
      
      // Ensure we have something in lastRawResponse for debugging
      if (!lastRawResponse) {
        lastRawResponse = { error: error instanceof Error ? error.message : "Unknown error" };
      }
      
      // Try to get transactions from cache as fallback
      try {
        const formattedStartDate = formatDateYYYYMMDD(startDate);
        const formattedEndDate = formatDateYYYYMMDD(endDate);
        
        const { data: fallbackCache } = await supabase
          .from("cached_transactions")
          .select("*")
          .gte("date", formattedStartDate)
          .lte("date", formattedEndDate);
          
        if (fallbackCache && fallbackCache.length > 0) {
          console.log(`ZohoService: Using ${fallbackCache.length} transactions from fallback cache after error`);
          
          const normalizedTransactions: Transaction[] = fallbackCache.map(tx => ({
            id: tx.id,
            date: tx.date,
            amount: Number(tx.amount),
            description: tx.description || '',
            category: tx.category,
            source: normalizeSource(tx.source),
            type: normalizeType(tx.type)
          }));
          
          return normalizedTransactions;
        }
      } catch (fallbackError) {
        console.error("ZohoService: Error getting fallback cache", fallbackError);
      }
      
      return getMockTransactions(startDate, endDate);
    }
  },
  
  // Force refresh transactions and bypass cache
  forceRefresh: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    console.log("ZohoService: Force refreshing transactions from", startDate, "to", endDate);
    
    // Fix any dates that might be in the wrong year
    startDate = fixDateYear(startDate);
    endDate = fixDateYear(endDate);
    
    // Track the requested date range as freshly cached
    const rangeKey = createDateRangeKey(startDate, endDate);
    
    // Use true for forceRefresh to bypass cache and true for returnRawResponse
    const response = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
    
    // Store the raw response for debugging
    if (response) {
      lastRawResponse = response;
    }
    
    cacheStats.lastRefresh = new Date();
    cacheStats.misses++; // Count as cache miss since we're forcing refresh
    
    // If successful, update the cached ranges
    if (response && !response.error) {
      cacheStats.cachedRanges[rangeKey] = new Date();
    }
    
    // Process the response based on its format
    if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
      return response.cached_transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        amount: Number(tx.amount),
        description: tx.description || '',
        category: tx.category,
        source: normalizeSource(tx.source),
        type: normalizeType(tx.type)
      }));
    }
    
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map(tx => ({
        id: tx.id,
        date: tx.date,
        amount: Number(tx.amount),
        description: tx.description || '',
        category: tx.category,
        source: normalizeSource(tx.source),
        type: normalizeType(tx.type)
      }));
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    console.log("ZohoService: Force refresh - Unexpected response format");
    return [];
  },
  
  // Get raw webhook response data for debugging
  getRawResponse: async (startDate: Date, endDate: Date): Promise<any> => {
    console.log("ZohoService: Getting raw response data for debugging");
    
    // Si tenemos una respuesta guardada, la devolvemos
    if (lastRawResponse) {
      console.log("ZohoService: Returning cached raw response");
      return lastRawResponse;
    }
    
    // Si no hay respuesta guardada, obtenemos una nueva con force refresh
    try {
      const response = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
      lastRawResponse = response;
      return response;
    } catch (error) {
      console.error("ZohoService: Error getting raw response", error);
      cacheStats.errors++;
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
  
  // Get the last raw response without making a new call
  getLastRawResponse: (): any => {
    return lastRawResponse;
  },
  
  // Set the last raw response manually
  setLastRawResponse: (data: any): void => {
    lastRawResponse = data;
  },
  
  // Mock data fallback
  getMockTransactions,
  
  // Get cache statistics
  getCacheStats: (): any => {
    const cachedRangeCount = Object.keys(cacheStats.cachedRanges).length;
    const total = cacheStats.hits + cacheStats.misses;
    
    return {
      ...cacheStats,
      hitRate: total > 0 ? (cacheStats.hits / total * 100).toFixed(1) + '%' : '0.0%',
      lastRefreshRelative: `${Math.round((Date.now() - cacheStats.lastRefresh.getTime()) / 60000)} minutes ago`,
      cachedRangeCount
    };
  },
  
  // Clear specific date range from cache
  clearCacheForDateRange: async (startDate: Date, endDate: Date): Promise<boolean> => {
    try {
      console.log(`ZohoService: Clearing cache for date range ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Fix any dates that might be in the wrong year
      startDate = fixDateYear(startDate);
      endDate = fixDateYear(endDate);
      
      // Format dates for DB query
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // Check how many transactions we're about to delete
      const { count: beforeCount } = await supabase
        .from("cached_transactions")
        .select("*", { count: 'exact', head: true })
        .gte("date", formattedStartDate)
        .lte("date", formattedEndDate);
        
      console.log(`ZohoService: Found ${beforeCount || 0} transactions to delete in range`);
      
      // Delete all transactions in the date range
      const { error } = await supabase
        .from("cached_transactions")
        .delete()
        .gte("date", formattedStartDate)
        .lte("date", formattedEndDate);
      
      if (error) {
        console.error("ZohoService: Error clearing cache for date range", error);
        return false;
      }
      
      // Check if delete was successful
      const { count: afterCount } = await supabase
        .from("cached_transactions")
        .select("*", { count: 'exact', head: true })
        .gte("date", formattedStartDate)
        .lte("date", formattedEndDate);
        
      const deletedCount = (beforeCount || 0) - (afterCount || 0);
      
      // Remove from tracking
      const rangeKey = createDateRangeKey(startDate, endDate);
      delete cacheStats.cachedRanges[rangeKey];
      
      console.log(`ZohoService: Successfully cleared cache for range ${formattedStartDate} to ${formattedEndDate}, removed ${deletedCount} transactions`);
      return true;
    } catch (error) {
      console.error("ZohoService: Error in clearCacheForDateRange", error);
      return false;
    }
  },
  
  // Check for stale cache and refresh if needed
  checkAndRefreshCache: async (startDate: Date, endDate: Date): Promise<void> => {
    try {
      // Fix any dates that might be in the wrong year
      startDate = fixDateYear(startDate);
      endDate = fixDateYear(endDate);
      
      // Format dates for DB query
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // Get cached data for the date range
      const { data: cachedTransactions } = await supabase
        .from("cached_transactions")
        .select("sync_date")
        .gte("date", formattedStartDate)
        .lte("date", formattedEndDate)
        .order('sync_date', { ascending: false })
        .limit(1);
      
      // Determine refresh threshold based on whether it's historical or current data
      const today = new Date();
      const isCurrentMonth = startDate.getMonth() === today.getMonth() && 
                           startDate.getFullYear() === today.getFullYear();
      
      // Use shorter window (2 hours) for current month, longer (7 days) for historical
      const refreshThresholdHours = isCurrentMonth ? 2 : 168; // 168 hours = 7 days
      
      if (cachedTransactions && cachedTransactions.length > 0) {
        const latestSync = new Date(cachedTransactions[0].sync_date);
        const thresholdTime = new Date(Date.now() - refreshThresholdHours * 60 * 60 * 1000);
        
        // If cache is older than our threshold, refresh in the background
        if (latestSync < thresholdTime) {
          console.log(`ZohoService: Cache is stale (${refreshThresholdHours} hour threshold), refreshing in background`);
          // Use setTimeout to make this non-blocking
          setTimeout(() => {
            ZohoService.forceRefresh(startDate, endDate)
              .then(() => console.log("ZohoService: Background cache refresh completed"))
              .catch(err => console.error("ZohoService: Background cache refresh failed", err));
          }, 100);
        }
      } else {
        // No cached data, do an immediate refresh
        console.log("ZohoService: No cached data found, refreshing in background");
        setTimeout(() => {
          ZohoService.forceRefresh(startDate, endDate)
            .then(() => console.log("ZohoService: Background cache refresh for missing data completed"))
            .catch(err => console.error("ZohoService: Background cache refresh for missing data failed", err));
        }, 100);
      }
    } catch (error) {
      console.error("ZohoService: Error checking cache age", error);
    }
  },
  
  // Get count of transactions in database for a specific date range
  getCachedTransactionCount: async (startDate: Date, endDate: Date): Promise<number> => {
    try {
      // Fix any dates that might be in the wrong year
      startDate = fixDateYear(startDate);
      endDate = fixDateYear(endDate);
      
      // Format dates for DB query
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // Also log dates to help debug any formatting issues
      console.log(`ZohoService: Checking cached count for range ${formattedStartDate} to ${formattedEndDate}`);
      
      const { count, error } = await supabase
        .from("cached_transactions")
        .select("*", { count: 'exact', head: true })
        .gte("date", formattedStartDate)
        .lte("date", formattedEndDate);
        
      if (error) {
        console.error("ZohoService: Error getting cached transaction count", error);
        return 0;
      }
      
      console.log(`ZohoService: Found ${count || 0} cached transactions in range`);
      return count || 0;
    } catch (error) {
      console.error("ZohoService: Error in getCachedTransactionCount", error);
      return 0;
    }
  },
  
  // Debug: Find and remove transactions with future years
  cleanupFutureDates: async (): Promise<number> => {
    try {
      const currentYear = new Date().getFullYear();
      const futureYearPrefix = `${currentYear + 1}`;
      
      // Count transactions with future years
      const { count, error: countError } = await supabase
        .from("cached_transactions")
        .select("*", { count: 'exact', head: true })
        .like("date", `${futureYearPrefix}-%`);
        
      if (countError) {
        console.error("ZohoService: Error counting future transactions", countError);
        return 0;
      }
      
      console.log(`ZohoService: Found ${count || 0} transactions with future year ${futureYearPrefix}`);
      
      if (count && count > 0) {
        // Delete transactions with future years
        const { error: deleteError } = await supabase
          .from("cached_transactions")
          .delete()
          .like("date", `${futureYearPrefix}-%`);
          
        if (deleteError) {
          console.error("ZohoService: Error deleting future transactions", deleteError);
          return 0;
        }
        
        console.log(`ZohoService: Successfully deleted ${count} transactions with future year ${futureYearPrefix}`);
        return count;
      }
      
      return 0;
    } catch (error) {
      console.error("ZohoService: Error in cleanupFutureDates", error);
      return 0;
    }
  }
};

export default ZohoService;
