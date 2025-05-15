import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";
import { logCacheEvent } from "@/components/Dashboard/CacheMonitor";
import { toast } from "@/hooks/use-toast";

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
        
        // Show toast with more specific error details
        toast({
          title: "Stripe API Error",
          description: `Error fetching Stripe data: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
        
        return getMockTransactions(startDate, endDate);
      }

      if (!data) {
        console.log("StripeService: No data returned, using mock data");
        logCacheEvent('miss', 'Stripe', { reason: 'No data returned' }, { startDate, endDate }, durationMs);
        
        toast({
          title: "Stripe API Warning",
          description: "No data returned from Stripe API, using mock data",
          variant: "default" // Changed from "warning" to "default"
        });
        
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
      
      toast({
        title: "Stripe API Error",
        description: `Unhandled error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
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
        
        // Show toast with detailed error message
        toast({
          title: "Stripe API Error",
          description: `Failed to fetch Stripe data: ${error.message}`,
          variant: "destructive"
        });
        
        return { error: error.message };
      }
      
      // Check if data has an error field indicating a problem
      if (data && data.error) {
        console.error("StripeService: Error in response data:", data.error);
        
        toast({
          title: "Stripe API Error",
          description: `Error from API: ${data.error}`,
          variant: "destructive"
        });
        
        return data; // Return the data with error field for debugging
      }
      
      // If we have a successful response with no data (empty transactions array perhaps)
      if (data && data.status === "success" && (!data.transactions || data.transactions.length === 0)) {
        console.log("StripeService: Successful request but no transactions found");
        
        toast({
          title: "Stripe API Notice",
          description: "No transactions found for the selected period",
          variant: "default" // Using default variant instead of warning
        });
      }
      
      // Store the response
      lastApiResponse.data = data;
      
      return data;
    } catch (err) {
      console.error("StripeService: Error in getRawResponse:", err);
      
      toast({
        title: "Stripe API Error",
        description: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Check if the Stripe API is accessible
   */
  checkApiConnectivity: async (): Promise<boolean> => {
    try {
      console.log("StripeService: Checking API connectivity with ping request");
      
      // Simple ping to check if API is responding
      const { data, error } = await supabase.functions.invoke("stripe-balance", {
        body: {
          ping: true
        }
      });

      if (error) {
        console.error("StripeService: Ping failed with error:", error);
        return false;
      }
      
      console.log("StripeService: Ping response:", data);
      
      // Consider it connected if we get a successful response
      const isConnected = !error && !!data && data.status === "success" && data.ping === true;
      
      if (!isConnected) {
        console.warn("StripeService: Stripe API is not accessible", data);
        
        // Show toast with connection issue
        toast({
          title: "Stripe Connectivity Issue",
          description: data?.message || "Unable to connect to Stripe API",
          variant: "default" // Using default variant instead of warning
        });
      }
      
      return isConnected;
    } catch (err) {
      console.error("StripeService: Error checking API connectivity:", err);
      
      toast({
        title: "Stripe API Error",
        description: `Connection check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
      return false;
    }
  }
};

export default StripeService;
