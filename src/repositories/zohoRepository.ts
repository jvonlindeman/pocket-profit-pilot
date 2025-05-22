import { Transaction } from "../types/financial";
import * as zohoApiClient from "../services/zoho/apiClient";
import { UnpaidInvoice } from "../services/zoho/api/types";

/**
 * ZohoRepository handles all data access related to Zoho directly from the API
 * without any intermediate storage
 */
export class ZohoRepository {
  private lastRawResponse: any = null;
  private unpaidInvoices: UnpaidInvoice[] = [];
  
  /**
   * Get transactions for a date range directly from the source
   */
  async getTransactions(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log("ZohoRepository: Getting transactions from", startDate, "to", endDate);
      const transactions = await this.fetchTransactionsFromSource(startDate, endDate, forceRefresh);
      return transactions;
    } catch (error) {
      console.error("Error in getTransactions:", error);
      return []; 
    }
  }

  /**
   * Implementation of fetching transactions directly from API
   */
  async fetchTransactionsFromSource(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log("ZohoRepository: Fetching transactions from", startDate, "to", endDate);
      const response = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      // Store the raw response for debugging
      if (response && typeof response === 'object') {
        this.lastRawResponse = response;
        
        // Store unpaid invoices if available
        if (response.facturas_sin_pagar && Array.isArray(response.facturas_sin_pagar)) {
          console.log("ZohoRepository: Storing unpaid invoices:", response.facturas_sin_pagar.length);
          this.unpaidInvoices = response.facturas_sin_pagar;
        }
      }
      
      // If the response is already an array of Transaction objects, return it
      if (Array.isArray(response) && response.length > 0 && 'type' in response[0] && 'source' in response[0]) {
        console.log(`ZohoRepository: Received ${response.length} processed Zoho transactions`);
        return response;
      } 
      
      // If we received a structured response with transactions inside
      if (response && typeof response === 'object') {
        if (response.cached_transactions && Array.isArray(response.cached_transactions)) {
          console.log(`ZohoRepository: Received ${response.cached_transactions.length} transactions`);
          return response.cached_transactions;
        }
      }
      
      console.log("ZohoRepository: No valid Zoho transactions found in response");
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
      const rawData = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, true, true);
      this.lastRawResponse = rawData;
      
      // Store unpaid invoices if available
      if (rawData && rawData.facturas_sin_pagar && Array.isArray(rawData.facturas_sin_pagar)) {
        this.unpaidInvoices = rawData.facturas_sin_pagar;
      }
      
      return rawData;
    } catch (error) {
      console.error("Error fetching raw Zoho response:", error);
      return { error: error.message || "Unknown error" };
    }
  }

  /**
   * Get unpaid invoices from the last response
   */
  getUnpaidInvoices(): UnpaidInvoice[] {
    // First try to get from the last raw response
    if (this.lastRawResponse && this.lastRawResponse.facturas_sin_pagar && 
        Array.isArray(this.lastRawResponse.facturas_sin_pagar)) {
      return this.lastRawResponse.facturas_sin_pagar;
    }
    
    // Otherwise return the stored unpaid invoices
    return this.unpaidInvoices;
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

export const zohoRepository = new ZohoRepository();
