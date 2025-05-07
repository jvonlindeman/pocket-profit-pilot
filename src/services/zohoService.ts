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
};

// Helper function to normalize source to match Transaction type
const normalizeSource = (source: string): 'Zoho' | 'Stripe' => {
  return source === 'Stripe' ? 'Stripe' : 'Zoho';
};

// Helper function to normalize transaction type
const normalizeType = (type: string): 'income' | 'expense' => {
  return type === 'income' ? 'income' : 'expense';
};

// Implementation that connects to Zoho Books API via make.com webhook
const ZohoService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date, forceRefresh = false): Promise<Transaction[]> => {
    try {
      console.log("ZohoService: Getting transactions for", startDate, "to", endDate, 
        forceRefresh ? "with force refresh" : "using cache if available");
      
      // Call the API client with the returnRawResponse option to get both raw response and processed data
      const response = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      
      // Store the raw response for debugging
      if (response) {
        lastRawResponse = response;
      }
      
      // Check if we got a cache hit
      if (response && response.cached) {
        // Update cache stats
        cacheStats.hits++;
        if (response.data && response.data.length > 0 && response.data[0].sync_date) {
          const latestSync = new Date(Math.max(...response.data.map(tx => new Date(tx.sync_date).getTime())));
          cacheStats.lastRefresh = latestSync;
        }
        
        console.log("ZohoService: Using cached data, processed", 
          response.data ? response.data.length : 0, "transactions");
        
        // If raw response contains data directly, transform and return it
        if (response.data && Array.isArray(response.data)) {
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
      } else {
        // No cache hit, it's a fresh response
        cacheStats.misses++;
        cacheStats.lastRefresh = new Date();
        
        // If response contains cached_transactions, use those
        if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
          console.log("ZohoService: Using freshly fetched and processed data,", 
            response.cached_transactions.length, "transactions");
            
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
      }
      
      // If we received processed transactions, extract them
      // This block handles the case where we got data but neither the cache nor cached_transactions format
      if (response) {
        // If we have data property as an array, use that
        if (response.data && Array.isArray(response.data)) {
          const normalizedTransactions: Transaction[] = response.data.map(tx => ({
            id: tx.id,
            date: tx.date,
            amount: Number(tx.amount),
            description: tx.description || '',
            category: tx.category,
            source: normalizeSource(tx.source),
            type: normalizeType(tx.type)
          }));
          
          console.log(`ZohoService: Using data.data array with ${normalizedTransactions.length} transactions`);
          return normalizedTransactions;
        }
        
        // Otherwise, if the response itself is an array, use that (from the single call to fetchTransactions)
        if (Array.isArray(response)) {
          const normalizedTransactions: Transaction[] = response.map(tx => ({
            id: tx.id,
            date: tx.date,
            amount: Number(tx.amount),
            description: tx.description || '',
            category: tx.category,
            source: normalizeSource(tx.source),
            type: normalizeType(tx.type)
          }));
          
          console.log(`ZohoService: Using direct array response with ${normalizedTransactions.length} transactions`);
          return normalizedTransactions;
        }
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
        const { data: fallbackCache } = await supabase
          .from("cached_transactions")
          .select("*")
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", endDate.toISOString().split('T')[0]);
          
        if (fallbackCache && fallbackCache.length > 0) {
          console.log("ZohoService: Using cache as fallback after error");
          
          // Transform fallback cache data to match Transaction type
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
    
    // Use true for forceRefresh to bypass cache and true for returnRawResponse
    const response = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
    
    // Store the raw response for debugging
    if (response) {
      lastRawResponse = response;
    }
    
    cacheStats.lastRefresh = new Date();
    cacheStats.misses++; // Count as cache miss since we're forcing refresh
    
    // If we received processed transactions, use those
    if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
      console.log("ZohoService: Using processed transactions from force refresh response");
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
    
    // If response is just an array of transactions
    if (Array.isArray(response)) {
      return response;
    }
    
    // If we have data property
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
    
    // If all else fails, make a direct call without raw response
    console.log("ZohoService: Force refresh - Response format unexpected, making direct call");
    const transactions = await fetchTransactionsFromWebhook(startDate, endDate, true, false);
    return transactions;
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
  
  // Obtener la última respuesta cruda sin hacer ninguna llamada
  getLastRawResponse: (): any => {
    return lastRawResponse;
  },
  
  // Establecer la respuesta cruda manualmente (útil para actualizar desde componentes)
  setLastRawResponse: (data: any): void => {
    lastRawResponse = data;
  },
  
  // Mock data for fallback when API fails or for development
  getMockTransactions,
  
  // Get cache statistics
  getCacheStats: (): any => {
    return {
      ...cacheStats,
      hitRate: cacheStats.hits + cacheStats.misses > 0 ? 
        (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1) + '%' : 'N/A',
      lastRefreshRelative: `${Math.round((Date.now() - cacheStats.lastRefresh.getTime()) / 60000)} minutes ago`
    };
  },
  
  // Check for stale cache and refresh if needed
  checkAndRefreshCache: async (startDate: Date, endDate: Date): Promise<void> => {
    try {
      // Get cached data for the date range
      const { data: cachedTransactions } = await supabase
        .from("cached_transactions")
        .select("sync_date")
        .gte("date", startDate.toISOString().split('T')[0])
        .lte("date", endDate.toISOString().split('T')[0])
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
  }
};

export default ZohoService;
