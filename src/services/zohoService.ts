
import { Transaction } from "../types/financial";
import { fetchTransactionsFromWebhook } from "./zoho/apiClient";
import { getMockTransactions } from "./zoho/mockData";
import { supabase } from "@/integrations/supabase/client";
import CacheService from "./cacheService";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";

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
      
      if (!forceRefresh) {
        // Try to get data from cache first
        const cacheCheck = await CacheService.checkCache('Zoho', startDate, endDate);
        
        if (cacheCheck.cached && cacheCheck.data) {
          console.log("ZohoService: Using cached data, found", cacheCheck.data.length, "transactions");
          lastRawResponse = { cached: true, data: cacheCheck.data, ...cacheCheck.metrics };
          cacheStats.hits++;
          return cacheCheck.data;
        } else {
          console.log("ZohoService: Cache miss, fetching from source");
          cacheStats.misses++;
        }
      }
      
      // Call the API client with the returnRawResponse option only once
      const response = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      
      // Store the raw response for debugging
      if (response) {
        lastRawResponse = response;
      }
      
      // Process the response to get transactions
      let transactions: Transaction[] = [];
      
      // If raw response contains data directly, transform it
      if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
        transactions = response.cached_transactions;
      } else if (response && response.data && Array.isArray(response.data)) {
        transactions = response.data.map((tx: any) => ({
          id: tx.id,
          date: tx.date,
          amount: Number(tx.amount),
          description: tx.description || '',
          category: tx.category,
          source: normalizeSource(tx.source),
          type: normalizeType(tx.type)
        }));
      } else {
        // If no processed transactions, try to extract them or fall back to mock data
        const apiTransactions = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
        
        if (apiTransactions && apiTransactions.length > 0) {
          transactions = apiTransactions;
        } else {
          console.warn("ZohoService: No transactions returned, using mock data");
          transactions = getMockTransactions(startDate, endDate);
        }
      }
      
      // Store the transactions in cache if we have real data (not mock)
      if (transactions.length > 0 && !transactions[0].id.startsWith('mock')) {
        console.log("ZohoService: Storing", transactions.length, "transactions in cache");
        await CacheService.storeTransactions('Zoho', startDate, endDate, transactions);
      }
      
      console.log(`ZohoService: Returning ${transactions.length} transactions`);
      cacheStats.lastRefresh = new Date();
      return transactions;
    } catch (error) {
      console.error("ZohoService: Error in getTransactions", error);
      cacheStats.errors++;
      
      // Ensure we have something in lastRawResponse for debugging
      if (!lastRawResponse) {
        lastRawResponse = { error: error instanceof Error ? error.message : "Unknown error" };
      }
      
      console.warn("ZohoService: Returning mock data due to error");
      return getMockTransactions(startDate, endDate);
    }
  },
  
  // Force refresh transactions and bypass cache
  forceRefresh: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    console.log("ZohoService: Force refreshing transactions from", startDate, "to", endDate);
    
    try {
      // Single call with returnRawResponse = true to get both raw response and processed data
      const response = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
      
      // Store the raw response for debugging
      if (response) {
        lastRawResponse = response;
      }
      
      cacheStats.lastRefresh = new Date();
      
      // Return processed transactions directly if available
      if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
        // Store in cache for future use
        await CacheService.storeTransactions('Zoho', startDate, endDate, response.cached_transactions);
        return response.cached_transactions;
      }
      
      // Otherwise use the standard method to process the transactions
      const transactions = await fetchTransactionsFromWebhook(startDate, endDate, true);
      
      // Store in cache for future use if we have real data (not mock)
      if (transactions && transactions.length > 0 && !transactions[0].id.startsWith('mock')) {
        await CacheService.storeTransactions('Zoho', startDate, endDate, transactions);
      }
      
      return transactions;
    } catch (error) {
      console.error("ZohoService: Error in forceRefresh", error);
      return getMockTransactions(startDate, endDate);
    }
  },
  
  // Get raw webhook response data for debugging
  getRawResponse: async (startDate: Date, endDate: Date): Promise<any> => {
    console.log("ZohoService: Getting raw response data for debugging");
    
    // Si tenemos una respuesta guardada, la devolvemos
    if (lastRawResponse) {
      console.log("ZohoService: Returning cached raw response");
      return lastRawResponse;
    }
    
    // Si no hay respuesta guardada, obtenemos una nueva
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
      console.log("ZohoService: Checking if cache needs refresh for", startDate, "to", endDate);
      
      // Get cache status without forcing refresh
      const cacheCheck = await CacheService.checkCache('Zoho', startDate, endDate, false);
      
      // If data is cached, no need to refresh
      if (cacheCheck.cached && cacheCheck.status === 'complete') {
        console.log("ZohoService: Cache is fresh, no refresh needed");
        return;
      }
      
      // If cache is missing or partial, consider refreshing
      const lastRefreshTime = new Date(cacheStats.lastRefresh).getTime();
      const now = Date.now();
      const hoursSinceRefresh = (now - lastRefreshTime) / (1000 * 60 * 60);
      
      // Refresh if more than 6 hours since last refresh or if cache is missing
      if (hoursSinceRefresh > 6 || !cacheCheck.cached) {
        console.log("ZohoService: Cache is stale or missing, scheduling refresh");
        
        // Use setTimeout to avoid blocking but make sure we're properly handling the Promise
        setTimeout(async () => {
          try {
            console.log("ZohoService: Executing scheduled cache refresh");
            // Properly await the forceRefresh call - don't try to use the returned Promise as an array
            await ZohoService.forceRefresh(startDate, endDate);
            console.log("ZohoService: Scheduled cache refresh completed");
          } catch (err) {
            console.error("ZohoService: Error during scheduled refresh:", err);
          }
        }, 100);
      } else {
        console.log("ZohoService: Cache refresh not needed yet");
      }
    } catch (error) {
      console.error("ZohoService: Error checking cache freshness:", error);
    }
  }
};

export default ZohoService;
