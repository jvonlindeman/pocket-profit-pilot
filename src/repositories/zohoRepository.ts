
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
      console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
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
   */
  async getRawResponse(startDate: Date, endDate: Date): Promise<any> {
    try {
      const rawData = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, false, true);
      this.lastRawResponse = rawData;
      return rawData;
    } catch (error) {
      console.error("Error fetching raw Zoho response:", error);
      return { error: error.message || "Unknown error" };
    }
  }

  /**
   * Get unpaid invoices from the last response
   */
  getUnpaidInvoices(): any[] {
    if (this.lastRawResponse && this.lastRawResponse.facturas_sin_pagar && 
        Array.isArray(this.lastRawResponse.facturas_sin_pagar)) {
      return this.lastRawResponse.facturas_sin_pagar;
    }
    return [];
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
