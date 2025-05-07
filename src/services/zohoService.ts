
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
      // Check if we can use the direct cache from Supabase
      if (!forceRefresh) {
        console.log("ZohoService: Trying direct cache access first");
        const { data: cachedTransactions, error: cacheError } = await supabase
          .from("cached_transactions")
          .select("*")
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", endDate.toISOString().split('T')[0]);
        
        if (!cacheError && cachedTransactions && cachedTransactions.length > 0) {
          // Check if the data is recent (within the last hour)
          const latestSync = new Date(Math.max(...cachedTransactions.map(tx => new Date(tx.sync_date).getTime())));
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (latestSync > oneHourAgo) {
            console.log("ZohoService: Using direct cache hit:", cachedTransactions.length, "transactions");
            cacheStats.hits++;
            cacheStats.lastRefresh = latestSync;
            
            // Transform and normalize the cached data to match Transaction type
            const normalizedTransactions: Transaction[] = cachedTransactions.map(tx => ({
              id: tx.id,
              date: tx.date,
              amount: Number(tx.amount),
              description: tx.description || '',
              category: tx.category,
              source: normalizeSource(tx.source),
              type: normalizeType(tx.type)
            }));
            
            return normalizedTransactions;
          } else {
            console.log("ZohoService: Cache is stale, fetching fresh data");
          }
        } else {
          console.log("ZohoService: No cache available or cache error:", cacheError);
          cacheStats.misses++;
        }
      }
      
      // First get the raw response for debugging
      const rawResponse = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      
      // Store the raw response for debugging regardless of whether it has errors
      if (rawResponse) {
        console.log("ZohoService: Storing raw response for debug purposes");
        lastRawResponse = rawResponse;
      }
      
      // If we received a cache hit directly with rawResponse.cached = true
      if (rawResponse && rawResponse.cached && Array.isArray(rawResponse.data)) {
        console.log("ZohoService: Received cached data from edge function");
        cacheStats.hits++;
        
        // Normalize the source field to match Transaction type
        const normalizedTransactions: Transaction[] = rawResponse.data.map(tx => ({
          ...tx,
          amount: Number(tx.amount),
          source: normalizeSource(tx.source),
          type: normalizeType(tx.type),
          description: tx.description || ''
        }));
        
        return normalizedTransactions;
      }
      
      // Process transactions normally
      // If there was an error in the raw response, this will return mock data as a fallback
      const transactions = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      if (transactions && transactions.length > 0) {
        console.log(`ZohoService: Successfully processed ${transactions.length} transactions`);
        cacheStats.lastRefresh = new Date();
        return transactions;
      } else {
        console.warn("ZohoService: No transactions returned, using mock data");
        return getMockTransactions(startDate, endDate);
      }
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
    try {
      // First get the raw response for debugging
      const rawResponse = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
      
      // Store the raw response
      if (rawResponse) {
        lastRawResponse = rawResponse;
      }
      
      const transactions = await fetchTransactionsFromWebhook(startDate, endDate, true);
      cacheStats.lastRefresh = new Date();
      return transactions;
    } catch (error) {
      console.error("ZohoService: Error in forceRefresh", error);
      cacheStats.errors++;
      if (!lastRawResponse) {
        lastRawResponse = { error: error instanceof Error ? error.message : "Unknown error" };
      }
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
      const { data: cachedTransactions } = await supabase
        .from("cached_transactions")
        .select("sync_date")
        .gte("date", startDate.toISOString().split('T')[0])
        .lte("date", endDate.toISOString().split('T')[0])
        .order('sync_date', { ascending: false })
        .limit(1);
      
      if (cachedTransactions && cachedTransactions.length > 0) {
        const latestSync = new Date(cachedTransactions[0].sync_date);
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        // If cache is more than 2 hours old, refresh in the background
        if (latestSync < twoHoursAgo) {
          console.log("ZohoService: Cache is stale, refreshing in background");
          // Use setTimeout to make this non-blocking
          setTimeout(() => {
            ZohoService.forceRefresh(startDate, endDate)
              .then(() => console.log("ZohoService: Background cache refresh completed"))
              .catch(err => console.error("ZohoService: Background cache refresh failed", err));
          }, 100);
        }
      }
    } catch (error) {
      console.error("ZohoService: Error checking cache age", error);
    }
  }
};

export default ZohoService;
