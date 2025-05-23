
import { Transaction } from "../types/financial";
import * as zohoApiClient from "../services/zoho/apiClient";
import CacheService from "../services/cache";
import { formatDateYYYYMMDD } from "../utils/dateUtils";

/**
 * ZohoRepository handles all data access related to Zoho,
 * including fetching data from API and cache management
 */
export class ZohoRepository {
  private lastRawResponse: any = null;
  // Add in-memory cache for raw responses keyed by date ranges
  private rawResponseCache: Map<string, {data: any, timestamp: number}> = new Map();
  // Cache TTL in milliseconds (5 minutes)
  private CACHE_TTL = 5 * 60 * 1000;
  
  /**
   * Get transactions for a date range with automatic cache handling
   */
  async getTransactions(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      return await this.fetchTransactionsFromSource(startDate, endDate, forceRefresh);
    } catch (error) {
      console.error("Error in getTransactions:", error);
      return []; 
    }
  }

  /**
   * Implementation of fetching transactions with cache integration
   */
  async fetchTransactionsFromSource(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log("Fetching Zoho transactions from", startDate, "to", endDate);
      const response = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      // Store the raw response for debugging
      if (response && typeof response === 'object') {
        this.lastRawResponse = response;
        
        // Also cache the raw response
        const cacheKey = this.generateCacheKey(startDate, endDate);
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
          console.log(`Received ${response.cached_transactions.length} cached Zoho transactions`);
          return response.cached_transactions;
        }
      }
      
      console.log("No valid Zoho transactions found in response");
      return [];
    } catch (error) {
      console.error("Error fetching transactions from Zoho:", error);
      throw error;
    }
  }

  /**
   * Return the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse;
  }

  /**
   * Get raw response data directly (for debugging purposes)
   * Now with in-memory caching to prevent redundant API calls
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

  /**
   * Force refresh to repair the cache
   */
  async repairCache(startDate: Date, endDate: Date): Promise<boolean> {
    try {
      await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, true);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Trigger a background refresh of the cache
   */
  async checkAndRefreshCache(startDate: Date, endDate: Date): Promise<void> {
    try {
      console.log("Background refresh of Zoho cache initiated");
      zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, true)
        .then(() => console.log("Background Zoho cache refresh completed"))
        .catch(err => console.error("Background Zoho cache refresh failed:", err));
    } catch (error) {
      console.error("Error checking/refreshing Zoho cache:", error);
    }
  }
}

// Export a singleton instance
export const zohoRepository = new ZohoRepository();
