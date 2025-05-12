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
      
      // Call the API client with the returnRawResponse option only once
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
          const latestSync = new Date(Math.max(...response.data.map((tx: any) => new Date(tx.sync_date).getTime())));
          cacheStats.lastRefresh = latestSync;
        }
        
        console.log("ZohoService: Using cached data, processed", 
          response.data ? response.data.length : 0, "transactions");
        
        // If raw response contains data directly, transform and return it
        if (response.data && Array.isArray(response.data)) {
          const normalizedTransactions: Transaction[] = response.data.map((tx: any) => ({
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
            
          const normalizedTransactions: Transaction[] = response.cached_transactions.map((tx: any) => ({
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
        
        // If no processed transactions, try to extract them from the response or fall back to mock data
        const transactions = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
        
        if (transactions && transactions.length > 0) {
          console.log(`ZohoService: Successfully processed ${transactions.length} transactions`);
          return transactions;
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
      
      console.warn("ZohoService: Returning mock data due to error");
      return getMockTransactions(startDate, endDate);
    }
  },
  
  // Force refresh transactions and bypass cache
  forceRefresh: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    console.log("ZohoService: Force refreshing transactions from", startDate, "to", endDate);
    
    // Single call with returnRawResponse = true to get both raw response and processed data
    const response = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
    
    // Store the raw response for debugging
    if (response) {
      lastRawResponse = response;
    }
    
    cacheStats.lastRefresh = new Date();
    
    // Return processed transactions directly if available
    if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
      return response.cached_transactions;
    }
    
    // Otherwise use the standard method to process the transactions
    const transactions = await fetchTransactionsFromWebhook(startDate, endDate, true);
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
    console.log("ZohoService: checkAndRefreshCache - Cache handling removed");
  }
};

export default ZohoService;
