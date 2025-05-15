
import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";
import { logCacheEvent } from "@/components/Dashboard/CacheMonitor";

// Placeholder for mock data
const getMockTransactions = (startDate: Date, endDate: Date) => {
  return {
    transactions: [
      {
        id: "mock-stripe-1",
        amount: 150,
        date: new Date().toISOString().split("T")[0],
        description: "Stripe mock income",
        type: "income",
        category: "Sales",
        source: "Stripe"
      }
    ],
    gross: 150,
    fees: 4.65,
    net: 145.35
  };
};

// Cache for the last API response
let lastApiResponse = {
  dateRange: "",
  timestamp: 0,
  data: null as any,
  isCached: false
};

// The StripeService handles fetching and processing Stripe transactions
const StripeService = {
  /**
   * Get Stripe transactions for a date range
   */
  getTransactions: async (
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ) => {
    try {
      // Format dates for the request
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      const dateRangeKey = `${formattedStartDate}_${formattedEndDate}`;
      
      console.log("StripeService: Fetching transactions from", formattedStartDate, "to", formattedEndDate);
      
      // Log cache check event
      logCacheEvent('check', 'Stripe', { forceRefresh }, { startDate, endDate });
      
      // Check memory cache for recent identical request
      const now = Date.now();
      if (
        !forceRefresh &&
        lastApiResponse.dateRange === dateRangeKey &&
        now - lastApiResponse.timestamp < 60000
      ) {
        console.log("StripeService: Using cached response from memory");
        logCacheEvent('hit', 'memory', { source: 'Stripe', age: now - lastApiResponse.timestamp }, { startDate, endDate });
        
        // Return the cached data with cache flags
        if (lastApiResponse.data && lastApiResponse.isCached) {
          // If we have the cached data and it was marked as cached, return it
          if (lastApiResponse.data.transactions && Array.isArray(lastApiResponse.data.transactions)) {
            lastApiResponse.data.transactions.forEach((tx: any) => {
              tx.fromCache = true;
              tx.isCached = true;
            });
          }
          return { ...lastApiResponse.data, cached: true };
        }
        return lastApiResponse.data;
      }

      // Call Supabase edge function to get Stripe data
      console.log("StripeService: Calling Stripe balance edge function");
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke("stripe-balance", {
        body: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          forceRefresh
        }
      });
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      if (error) {
        console.error("StripeService: Error fetching transactions:", error);
        logCacheEvent('miss', 'Stripe', { error: error.message }, { startDate, endDate }, durationMs);
        return getMockTransactions(startDate, endDate);
      }

      if (!data) {
        console.log("StripeService: No data returned, using mock data");
        logCacheEvent('miss', 'Stripe', { reason: 'No data returned' }, { startDate, endDate }, durationMs);
        return getMockTransactions(startDate, endDate);
      }

      console.log("StripeService: Received data:", {
        transactions: data.transactions?.length || 0,
        cached: !!data.cached,
        isCached: !!data.isCached,
        cache_hit: !!data.cache_hit
      });

      // Check for cache indicators in the response
      const isCached = !!data.cached || !!data.cache_hit || !!data.isCached;
      
      // Store in memory cache
      lastApiResponse = {
        dateRange: dateRangeKey,
        timestamp: now,
        data,
        isCached
      };

      // Log appropriate cache event
      if (isCached) {
        logCacheEvent('hit', 'Stripe', { 
          transactionCount: data.transactions?.length,
          responseFlags: {
            cached: !!data.cached,
            cache_hit: !!data.cache_hit,
            isCached: !!data.isCached
          }
        }, { startDate, endDate }, durationMs);
        
        // Mark transactions as cached
        if (data.transactions && Array.isArray(data.transactions)) {
          data.transactions.forEach(tx => {
            tx.fromCache = true;
            tx.isCached = true;
            tx.cache_hit = true;
          });
        }
      } else {
        logCacheEvent('api_call', 'Stripe', { 
          transactionCount: data.transactions?.length
        }, { startDate, endDate }, durationMs);
      }

      // Return the data with cache status
      return { ...data, cached: isCached };
    } catch (err) {
      console.error("StripeService: Unhandled error:", err);
      logCacheEvent('miss', 'Stripe', { error: err instanceof Error ? err.message : 'Unknown error' }, { startDate, endDate });
      return getMockTransactions(startDate, endDate);
    }
  },

  /**
   * Get the last raw response - needed for debugging
   */
  getLastRawResponse: () => {
    return lastApiResponse.data;
  },
  
  /**
   * Get raw response data directly (for debugging purposes)
   */
  getRawResponse: async (startDate: Date, endDate: Date, forceRefresh = false): Promise<any> => {
    try {
      // Format dates for the request
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      
      console.log("StripeService: Fetching raw response from", formattedStartDate, "to", formattedEndDate);
      
      const { data, error } = await supabase.functions.invoke("stripe-balance", {
        body: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          forceRefresh: forceRefresh,
          rawResponse: true
        }
      });
      
      if (error) {
        console.error("StripeService: Error fetching raw response:", error);
        return { error: error.message };
      }
      
      // Store the response
      lastApiResponse.data = data;
      
      return data;
    } catch (err) {
      console.error("StripeService: Error in getRawResponse:", err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Check if the Stripe API is accessible
   */
  checkApiConnectivity: async (): Promise<boolean> => {
    try {
      // Simple ping to check if API is responding
      const { data, error } = await supabase.functions.invoke("stripe-balance", {
        body: {
          ping: true
        }
      });

      return !error && !!data;
    } catch {
      return false;
    }
  }
};

export default StripeService;
