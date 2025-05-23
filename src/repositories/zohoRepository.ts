
import { Transaction } from "../types/financial";
import * as zohoApiClient from "../services/zoho/apiClient";
import { formatDateYYYYMMDD } from "../utils/dateUtils";

/**
 * ZohoRepository handles all data access related to Zoho,
 * with minimal in-memory caching for UI performance
 */
export class ZohoRepository {
  private lastRawResponse: any = null;
  
  /**
   * Get transactions for a date range
   */
  async getTransactions(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log(`Getting Zoho transactions from ${startDate} to ${endDate}, forceRefresh: ${forceRefresh}`);
      
      // Fetch from API client, which handles deduplication and caching internally
      const response = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      // Store the raw response for debugging
      if (response && typeof response === 'object') {
        this.lastRawResponse = response;
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
   * Get raw response data directly
   */
  async getRawResponse(startDate: Date, endDate: Date, forceRefresh = false): Promise<any> {
    try {
      console.log("Fetching Zoho raw response for", startDate, "to", endDate);
      const rawData = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      this.lastRawResponse = rawData;
      return rawData;
    } catch (error) {
      console.error("Error fetching raw Zoho response:", error);
      return { error: error.message || "Unknown error" };
    }
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
