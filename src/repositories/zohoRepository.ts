
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
      
      // Use the unified API client gateway function
      const response = await zohoApiClient.fetchZohoData(startDate, endDate, forceRefresh);
      
      // Store the raw response for debugging
      this.lastRawResponse = response;
      
      let transactions: Transaction[] = [];
      
      if (Array.isArray(response)) {
        // If the response is already an array of Transaction objects
        console.log(`Received ${response.length} already processed Zoho transactions`);
        transactions = response;
      } 
      else if (response && typeof response === 'object') {
        if (response.cached_transactions && Array.isArray(response.cached_transactions)) {
          // If we received a structured response with transactions inside
          console.log(`Received ${response.cached_transactions.length} cached Zoho transactions`);
          transactions = response.cached_transactions;
        } 
        else {
          // Process the raw response through our processor
          console.log("Processing raw Zoho response data");
          const processed = zohoApiClient.processTransactionResponse(response);
          transactions = processed;
        }
      }
      
      console.log(`Final transaction count: ${transactions.length}`);
      return transactions;
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
      const rawData = await zohoApiClient.fetchZohoData(startDate, endDate, forceRefresh, true);
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
      // Use the main fetch function with minimal data to check connectivity
      const response = await zohoApiClient.fetchZohoData(
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
