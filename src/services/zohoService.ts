
import { Transaction } from "../types/financial";
import { fetchTransactionsFromWebhook } from "./zoho/apiClient";
import { getMockTransactions } from "./zoho/mockData";

// Variable para almacenar la última respuesta cruda del webhook
let lastRawResponse: any = null;

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
        forceRefresh ? "with force refresh" : "direct fetch");
      
      // Call the API client with the returnRawResponse option
      console.log("ZohoService: Fetching data from API");
      const response = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      
      // Store the raw response for debugging
      if (response) {
        lastRawResponse = response;
        console.log("ZohoService: Stored raw response, type:", typeof response);
      }
      
      // Process the response based on its format
      if (response && response.cached_transactions && Array.isArray(response.cached_transactions)) {
        console.log(`ZohoService: Using ${response.cached_transactions.length} transactions from response.cached_transactions`);
        
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
      
      // Ensure we have something in lastRawResponse for debugging
      if (!lastRawResponse) {
        lastRawResponse = { error: error instanceof Error ? error.message : "Unknown error" };
      }
      
      return getMockTransactions(startDate, endDate);
    }
  },
  
  // Force refresh transactions (now behaves the same as getTransactions)
  forceRefresh: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    console.log("ZohoService: Force refreshing transactions from", startDate, "to", endDate);
    return ZohoService.getTransactions(startDate, endDate, true);
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
  
  // Get cache statistics (simplified placeholder for compatibility)
  getCacheStats: (): any => {
    return {
      hits: 0,
      misses: 0,
      errors: 0,
      hitRate: '0.0%',
      lastRefreshRelative: 'N/A - Cache disabled',
      cachedRangeCount: 0
    };
  }
};

export default ZohoService;
