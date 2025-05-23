
import { Transaction, UnpaidInvoice } from "../types/financial";
import * as zohoApiClient from "../services/zoho/apiClient";
import { formatDateYYYYMMDD } from "../utils/dateUtils";
import { useApiCalls } from "@/contexts/ApiCallsContext";
import { apiRequestManager } from "@/utils/ApiRequestManager";

/**
 * ZohoRepository handles all data access related to Zoho,
 * with minimal in-memory caching for UI performance
 */
export class ZohoRepository {
  private lastRawResponse: any = null;
  private apiCallsContext?: ReturnType<typeof useApiCalls>;
  private unpaidInvoices: UnpaidInvoice[] = [];
  private lastRequestKey: string = '';
  private inProgressRequestsMap: Map<string, Promise<any>> = new Map();
  
  /**
   * Set the API calls context for tracking
   */
  setApiCallsContext(context: ReturnType<typeof useApiCalls>) {
    this.apiCallsContext = context;
  }

  /**
   * Track API call
   */
  private trackApiCall() {
    if (this.apiCallsContext) {
      this.apiCallsContext.incrementZohoApiCalls();
    }
  }
  
  /**
   * Get transactions for a date range with improved deduplication
   */
  async getTransactions(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log(`Getting Zoho transactions from ${startDate} to ${endDate}, forceRefresh: ${forceRefresh}`);
      
      // Generate a cache key for deduplication
      const cacheKey = `zoho-transactions-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
      
      // Store the last request key for deduplication
      this.lastRequestKey = cacheKey;
      
      // Check if there's already a request in progress with this key
      if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
        console.log(`ZohoRepository: Reusing in-progress request for ${cacheKey}`);
        return await this.inProgressRequestsMap.get(cacheKey)!;
      }
      
      // If forcing a refresh, clear the cache entry and in-progress request
      if (forceRefresh) {
        apiRequestManager.clearCacheEntry(cacheKey);
        this.inProgressRequestsMap.delete(cacheKey);
      }
      
      // Create and store the promise
      const requestPromise = this.executeTransactionsRequest(cacheKey, startDate, endDate, forceRefresh);
      this.inProgressRequestsMap.set(cacheKey, requestPromise);
      
      // Execute the request and clean up after
      try {
        return await requestPromise;
      } finally {
        // Clean up after the request is done
        this.inProgressRequestsMap.delete(cacheKey);
      }
    } catch (error) {
      console.error("Error fetching transactions from Zoho:", error);
      return []; 
    }
  }
  
  /**
   * Execute the actual transactions request with ApiRequestManager
   */
  private async executeTransactionsRequest(
    cacheKey: string,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<Transaction[]> {
    return await apiRequestManager.executeRequest(
      cacheKey,
      async () => {
        // Track the API call
        this.trackApiCall();
        
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
            
            // Also process unpaid invoices if available
            this.unpaidInvoices = zohoApiClient.processUnpaidInvoicesResponse(response);
            console.log(`Processed ${this.unpaidInvoices.length} unpaid invoices`);
          }
        }
        
        console.log(`Final transaction count: ${transactions.length}`);
        return transactions;
      },
      forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes TTL, or 0 if force refresh
      30000 // 30 second cooldown (increased from default)
    );
  }
  
  /**
   * Get unpaid invoices
   */
  getUnpaidInvoices(): UnpaidInvoice[] {
    return this.unpaidInvoices;
  }

  /**
   * Return the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse;
  }

  /**
   * Get raw response data directly with improved deduplication
   */
  async getRawResponse(startDate: Date, endDate: Date, forceRefresh = false): Promise<any> {
    try {
      console.log("Fetching Zoho raw response for", startDate, "to", endDate);
      
      // Generate a cache key for deduplication
      const cacheKey = `zoho-raw-response-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
      
      // Check if there's already a request in progress with this key
      if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
        console.log(`ZohoRepository: Reusing in-progress raw request for ${cacheKey}`);
        return await this.inProgressRequestsMap.get(cacheKey)!;
      }
      
      // If forcing a refresh, clear the cache entry and in-progress request
      if (forceRefresh) {
        apiRequestManager.clearCacheEntry(cacheKey);
        this.inProgressRequestsMap.delete(cacheKey);
      }
      
      // Create and store the promise
      const requestPromise = this.executeRawResponseRequest(cacheKey, startDate, endDate, forceRefresh);
      this.inProgressRequestsMap.set(cacheKey, requestPromise);
      
      // Execute the request and clean up after
      try {
        return await requestPromise;
      } finally {
        // Clean up after the request is done
        this.inProgressRequestsMap.delete(cacheKey);
      }
    } catch (error) {
      console.error("Error fetching raw Zoho response:", error);
      return { error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Execute the actual raw response request with ApiRequestManager
   */
  private async executeRawResponseRequest(
    cacheKey: string,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<any> {
    return await apiRequestManager.executeRequest(
      cacheKey,
      async () => {
        // Track the API call
        this.trackApiCall();
        
        // Fetch raw data
        const rawData = await zohoApiClient.fetchZohoData(startDate, endDate, forceRefresh, true);
        this.lastRawResponse = rawData;
        return rawData;
      },
      forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes TTL, or 0 if force refresh
      30000 // 30 second cooldown (increased from default)
    );
  }

  /**
   * Check if API is accessible
   */
  async checkApiConnectivity(): Promise<boolean> {
    try {
      // Use a fixed cache key for connectivity checks with long cooldown
      const cacheKey = `zoho-connectivity-check`;
      
      // Use the ApiRequestManager to deduplicate requests
      return await apiRequestManager.executeRequest(
        cacheKey,
        async () => {
          // Track the API call
          this.trackApiCall();
          
          // Use the main fetch function with minimal data to check connectivity
          const response = await zohoApiClient.fetchZohoData(
            new Date(), 
            new Date(),
            false,
            true
          );
          return !!response && !response.error;
        },
        60000, // 60 second TTL for connectivity checks (increased)
        5000   // 5 second cooldown
      );
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const zohoRepository = new ZohoRepository();
