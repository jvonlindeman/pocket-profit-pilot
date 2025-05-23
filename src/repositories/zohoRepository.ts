
import { Transaction } from "../types/financial";
import * as zohoApiClient from "../services/zoho/apiClient";
import { formatDateYYYYMMDD } from "../utils/dateUtils";

/**
 * ZohoRepository handles all data access related to Zoho,
 * with minimal in-memory caching for UI performance
 */
export class ZohoRepository {
  private lastRawResponse: any = null;
  
  // Simple in-memory cache with a short TTL (5 minutes)
  private rawResponseCache: Map<string, {data: any, timestamp: number}> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Get transactions for a date range with simple in-memory caching
   */
  async getTransactions(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log(`Getting Zoho transactions from ${startDate} to ${endDate}, forceRefresh: ${forceRefresh}`);
      
      // Generate cache key for this request
      const cacheKey = this.generateCacheKey(startDate, endDate);
      
      // Check if we have a valid cached response and not forcing refresh
      if (!forceRefresh && this.rawResponseCache.has(cacheKey)) {
        const cached = this.rawResponseCache.get(cacheKey);
        
        // Only use cache if it's within TTL
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          console.log("Using cached Zoho transactions (in-memory)");
          
          // If the cached data is already an array of transactions, return it
          if (Array.isArray(cached.data) && cached.data.length > 0 && 'type' in cached.data[0]) {
            return cached.data;
          }
          
          // If we have a structured response with transactions inside
          if (cached.data && typeof cached.data === 'object') {
            if (cached.data.cached_transactions && Array.isArray(cached.data.cached_transactions)) {
              return cached.data.cached_transactions;
            }
          }
        }
      }
      
      // If not cached or cache expired, fetch from API
      const response = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      // Store the raw response for debugging and in memory cache
      if (response && typeof response === 'object') {
        this.lastRawResponse = response;
        
        // Cache the raw response
        this.rawResponseCache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }
      
      // If the response is already an array of Transaction objects, return it
      if (Array.isArray(response) && response.length > 0 && 'type' in response[0] && 'source' in response[0]) {
        console.log(`Received ${response.length} processed Zoho transactions`);
        return response;
      } 
      
      // If we received a structured response with transactions inside
      if (response && typeof response === 'object') {
        if (response.cached_transactions && Array.isArray(response.cached_transactions)) {
          console.log(`Received ${response.cached_transactions.length} Zoho transactions`);
          return response.cached_transactions;
        }
      }
      
      console.log("No valid Zoho transactions found in response");
      return [];
    } catch (error) {
      console.error("Error fetching transactions from Zoho:", error);
      return []; 
    }
  }

  /**
   * Return the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse;
  }

  /**
   * Get raw response data directly (using simple in-memory caching)
   */
  async getRawResponse(startDate: Date, endDate: Date, forceRefresh = false): Promise<any> {
    try {
      // Generate a cache key from the date range
      const cacheKey = this.generateCacheKey(startDate, endDate);

      // Check if we have a recent cached response and forceRefresh is false
      if (!forceRefresh && this.rawResponseCache.has(cacheKey)) {
        const cached = this.rawResponseCache.get(cacheKey);
        // Only use cache if it's within TTL
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          console.log("Using cached Zoho raw response for", startDate, "to", endDate);
          this.lastRawResponse = cached.data;
          return cached.data;
        }
      }

      console.log("Fetching fresh Zoho raw response for", startDate, "to", endDate);
      const rawData = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      this.lastRawResponse = rawData;
      
      // Cache the response
      this.rawResponseCache.set(cacheKey, {
        data: rawData,
        timestamp: Date.now()
      });
      
      return rawData;
    } catch (error) {
      console.error("Error fetching raw Zoho response:", error);
      return { error: error.message || "Unknown error" };
    }
  }

  /**
   * Generate a cache key from a date range
   */
  private generateCacheKey(startDate: Date, endDate: Date): string {
    const startStr = formatDateYYYYMMDD(startDate);
    const endStr = formatDateYYYYMMDD(endDate);
    return `zoho-raw-${startStr}-${endStr}`;
  }

  /**
   * Check if API is accessible
   */
  async checkApiConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity check - just try to get a minimal response
      const response = await zohoApiClient.fetchTransactionsFromWebhook(
        new Date(), 
        new Date(),
        false,
        true
      );
      return !!response && !response.error;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const zohoRepository = new ZohoRepository();
