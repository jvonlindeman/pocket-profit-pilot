
import { Transaction } from "../types/financial";
import { fetchTransactionsFromWebhook } from "./zoho/apiClient";
import { getMockTransactions } from "./zoho/mockData";
import { supabase } from "@/integrations/supabase/client";
import CacheService from "./cache";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { toast } from "@/components/ui/use-toast";

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
        const cacheResult = await CacheService.storeTransactions('Zoho', startDate, endDate, transactions);
        console.log("ZohoService: Cache storage result:", cacheResult ? "Success" : "Failed");
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
        const cacheResult = await CacheService.storeTransactions('Zoho', startDate, endDate, response.cached_transactions);
        console.log("ZohoService: Cache storage result during force refresh:", cacheResult ? "Success" : "Failed");
        return response.cached_transactions;
      }
      
      // Otherwise use the standard method to process the transactions
      const transactions = await fetchTransactionsFromWebhook(startDate, endDate, true);
      
      // Store in cache for future use if we have real data (not mock)
      if (transactions && transactions.length > 0 && !transactions[0].id.startsWith('mock')) {
        const cacheResult = await CacheService.storeTransactions('Zoho', startDate, endDate, transactions);
        console.log("ZohoService: Cache storage result during force refresh:", cacheResult ? "Success" : "Failed");
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
        
        // Use a proper Promise-based approach with setTimeout
        setTimeout(() => {
          console.log("ZohoService: Executing scheduled cache refresh");
          // Properly handle the Promise returned by forceRefresh
          ZohoService.forceRefresh(startDate, endDate)
            .then(transactions => {
              console.log("ZohoService: Scheduled cache refresh completed successfully with", 
                transactions.length, "transactions");
              // Notify user of successful cache refresh
              toast({
                title: "Cache Refreshed",
                description: `Successfully refreshed ${transactions.length} transactions for the selected period.`,
                duration: 3000,
              });
            })
            .catch(err => {
              console.error("ZohoService: Error during scheduled refresh:", err);
              // Notify user of refresh failure
              toast({
                title: "Cache Refresh Failed",
                description: "Failed to refresh the transaction cache. Please try again later.",
                variant: "destructive",
                duration: 5000,
              });
            });
        }, 100);
      } else {
        console.log("ZohoService: Cache refresh not needed yet");
      }
    } catch (error) {
      console.error("ZohoService: Error checking cache freshness:", error);
    }
  },
  
  // Verify API connectivity
  checkApiConnectivity: async (): Promise<boolean> => {
    try {
      // Create a minimal date range to test connectivity
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Try to get raw response with minimal data
      const response = await fetchTransactionsFromWebhook(yesterday, today, false, true);
      
      // If we get any response, the API is connected
      return !!response;
    } catch (error) {
      console.error("ZohoService: API connectivity check failed:", error);
      return false;
    }
  },
  
  // Repair cache inconsistencies
  repairCache: async (startDate: Date, endDate: Date): Promise<boolean> => {
    try {
      console.log("ZohoService: Attempting to repair cache for", startDate, "to", endDate);
      
      // Check if the segment exists but no transactions
      const segmentQuery = await supabase
        .from('cache_segments')
        .select('*')
        .eq('source', 'Zoho')
        .lte('start_date', formatDateYYYYMMDD(startDate))
        .gte('end_date', formatDateYYYYMMDD(endDate))
        .eq('status', 'complete');
        
      if (segmentQuery.error) {
        console.error("ZohoService: Error checking cache segments:", segmentQuery.error);
        return false;
      }
      
      // If segments exist, check if transactions exist
      if (segmentQuery.data && segmentQuery.data.length > 0) {
        console.log("ZohoService: Found", segmentQuery.data.length, "cache segments that should contain data");
        
        // Count transactions for this period
        const transactionQuery = await supabase
          .from('cached_transactions')
          .select('count', { count: 'exact' })
          .eq('source', 'Zoho')
          .gte('date', formatDateYYYYMMDD(startDate))
          .lte('date', formatDateYYYYMMDD(endDate));
          
        if (transactionQuery.error) {
          console.error("ZohoService: Error counting cached transactions:", transactionQuery.error);
          return false;
        }
        
        const transactionCount = transactionQuery.count || 0;
        
        // If we have segments but no or too few transactions, force a refresh
        if (transactionCount < 10) {
          console.log("ZohoService: Cache inconsistency detected. Found segments but only", 
            transactionCount, "transactions. Forcing refresh...");
            
          // Force refresh to repair the cache
          const transactions = await ZohoService.forceRefresh(startDate, endDate);
          
          // Notify user of the repair
          toast({
            title: "Cache Repaired",
            description: `Repaired inconsistent cache for ${formatDateYYYYMMDD(startDate)} to ${formatDateYYYYMMDD(endDate)} with ${transactions.length} transactions.`,
            duration: 5000,
          });
          
          return transactions.length > 0;
        } else {
          console.log("ZohoService: Cache appears consistent with", transactionCount, "transactions");
          return true;
        }
      }
      
      // No cache segments found, nothing to repair
      return false;
    } catch (error) {
      console.error("ZohoService: Error repairing cache:", error);
      return false;
    }
  }
};

export default ZohoService;
