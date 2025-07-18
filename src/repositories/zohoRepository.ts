
import { Transaction } from "../types/financial";
import * as zohoApiClient from "../services/zoho/apiClient";
import { formatDateYYYYMMDD } from "../utils/dateUtils";
import { useApiCalls } from "@/contexts/ApiCallsContext";
import { apiRequestManager } from "@/utils/ApiRequestManager";
import CacheService from "@/services/cache";
import { cacheStorage } from "@/services/cache/storage";

/**
 * ZohoRepository handles all data access related to Zoho,
 * with cache-first approach to prevent unnecessary webhook calls
 */
export class ZohoRepository {
  private lastRawResponse: any = null;
  private apiCallsContext?: ReturnType<typeof useApiCalls>;
  private lastRequestKey: string = '';
  private inProgressRequestsMap: Map<string, Promise<any>> = new Map();
  private collaboratorExpenses: any[] = [];
  
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
   * Extract and track webhook calls count from response
   */
  private trackWebhookCalls(response: any) {
    if (this.apiCallsContext && response && typeof response.llamados === 'number') {
      console.log(`📞 ZohoRepository: Webhook called ${response.llamados} times in this load`);
      this.apiCallsContext.updateWebhookCallsCount(response.llamados);
      
      // Alert if multiple calls detected
      if (response.llamados > 1) {
        console.warn(`⚠️ ZohoRepository: DUPLICATE WEBHOOK CALLS DETECTED - ${response.llamados} calls in single load!`);
      }
    }
  }
  
  /**
   * Get transactions for a date range with cache-first approach
   */
  async getTransactions(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log(`🔍 ZohoRepository: Getting transactions from ${startDate.toDateString()} to ${endDate.toDateString()}, forceRefresh: ${forceRefresh}`);
      
      // Generate a cache key for deduplication
      const cacheKey = `zoho-transactions-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
      this.lastRequestKey = cacheKey;
      
      // Check if there's already a request in progress with this key
      if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
        console.log(`♻️ ZohoRepository: Reusing in-progress request for ${cacheKey}`);
        return await this.inProgressRequestsMap.get(cacheKey)!;
      }
      
      // **CACHE-FIRST APPROACH**: Check cache before making any API calls
      if (!forceRefresh) {
        console.log(`📦 ZohoRepository: Checking cache first for ${cacheKey}`);
        
        const cacheResult = await CacheService.checkCache('Zoho', startDate, endDate);
        
        if (cacheResult.cached && !cacheResult.partial) {
          console.log(`✅ ZohoRepository: Cache HIT - Loading from cache without webhook call`);
          
          // Use the cache storage to get transactions directly
          const startDateStr = formatDateYYYYMMDD(startDate);
          const endDateStr = formatDateYYYYMMDD(endDate);
          const cachedTransactions = await cacheStorage.getTransactions('Zoho', startDateStr, endDateStr);
          
          if (cachedTransactions && cachedTransactions.length > 0) {
            console.log(`📋 ZohoRepository: Successfully loaded ${cachedTransactions.length} transactions from cache`);
            return cachedTransactions;
          }
        } else {
          console.log(`❌ ZohoRepository: Cache MISS or partial cache - Will need to call webhook`);
        }
      } else {
        console.log(`🔄 ZohoRepository: Force refresh requested - Clearing cache and calling webhook`);
        // Clear cache entries for force refresh
        await CacheService.clearCache({
          source: 'Zoho',
          startDate,
          endDate
        });
        apiRequestManager.clearCacheEntry(cacheKey);
      }
      
      // Only reach here if cache miss or force refresh
      console.log(`🌐 ZohoRepository: Cache miss or force refresh - Making webhook call`);
      
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
      console.error("❌ ZohoRepository: Error fetching transactions:", error);
      return []; 
    }
  }
  
  /**
   * Execute the actual transactions request with webhook call tracking
   */
  private async executeTransactionsRequest(
    cacheKey: string,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<Transaction[]> {
    console.log(`🚀 ZohoRepository: WEBHOOK CALL - Making actual API request for ${cacheKey}`);
    
    // Track the API call
    this.trackApiCall();
    
    // Use the unified API client gateway function
    const response = await zohoApiClient.fetchZohoData(startDate, endDate, forceRefresh);
    
    // Store the raw response for debugging
    this.lastRawResponse = response;
    
    // Track webhook calls count from response
    this.trackWebhookCalls(response);
    
    let transactions: Transaction[] = [];
    
    if (Array.isArray(response)) {
      // If the response is already an array of Transaction objects
      console.log(`📊 ZohoRepository: Received ${response.length} already processed Zoho transactions`);
      transactions = response;
    } 
    else if (response && typeof response === 'object') {
      if (response.cached_transactions && Array.isArray(response.cached_transactions)) {
        // If we received a structured response with transactions inside
        console.log(`📋 ZohoRepository: Received ${response.cached_transactions.length} cached Zoho transactions`);
        transactions = response.cached_transactions;
      } 
      else {
        // Process the raw response through our processor
        console.log("⚙️ ZohoRepository: Processing raw Zoho response data");
        const processed = zohoApiClient.processTransactionResponse(response);
        transactions = processed;
        
        // Process collaborator data if available
        if (response.colaboradores && Array.isArray(response.colaboradores)) {
          this.collaboratorExpenses = response.colaboradores;
          console.log(`👥 ZohoRepository: Processed ${this.collaboratorExpenses.length} collaborator expenses`);
        }
      }
    }
    
    // Store in cache after successful fetch
    if (transactions.length > 0) {
      console.log(`💾 ZohoRepository: Storing ${transactions.length} transactions in cache`);
      try {
        await CacheService.storeTransactions('Zoho', startDate, endDate, transactions);
      } catch (cacheError) {
        console.error("⚠️ ZohoRepository: Failed to store transactions in cache:", cacheError);
        // Continue without failing the request
      }
    }
    
    console.log(`✅ ZohoRepository: Final transaction count: ${transactions.length}`);
    return transactions;
  }

  /**
   * Get collaborator expenses data
   */
  getCollaboratorExpenses(): any[] {
    return this.collaboratorExpenses;
  }

  /**
   * Return the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse;
  }

  /**
   * Get raw response data directly with cache-first approach
   */
  async getRawResponse(startDate: Date, endDate: Date, forceRefresh = false): Promise<any> {
    try {
      console.log("🔍 ZohoRepository: Fetching raw response for", startDate.toDateString(), "to", endDate.toDateString());
      
      // Generate a cache key for deduplication
      const cacheKey = `zoho-raw-response-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
      
      // Check if there's already a request in progress with this key
      if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
        console.log(`♻️ ZohoRepository: Reusing in-progress raw request for ${cacheKey}`);
        return await this.inProgressRequestsMap.get(cacheKey)!;
      }
      
      // For raw responses, we always call the API as this is typically for debugging
      if (forceRefresh) {
        console.log(`🔄 ZohoRepository: Force refresh for raw response - clearing cache`);
        apiRequestManager.clearCacheEntry(cacheKey);
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
      console.error("❌ ZohoRepository: Error fetching raw response:", error);
      return { error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Execute the actual raw response request
   */
  private async executeRawResponseRequest(
    cacheKey: string,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<any> {
    console.log(`🚀 ZohoRepository: RAW WEBHOOK CALL - Making raw API request for ${cacheKey}`);
    
    this.trackApiCall();
    
    const rawData = await zohoApiClient.fetchZohoData(startDate, endDate, forceRefresh, true);
    this.lastRawResponse = rawData;
    
    // Track webhook calls from raw response too
    this.trackWebhookCalls(rawData);
    
    return rawData;
  }

  /**
   * Check if API is accessible with minimal cache
   */
  async checkApiConnectivity(): Promise<boolean> {
    try {
      // Use a fixed cache key for connectivity checks with long cooldown
      const cacheKey = `zoho-connectivity-check`;
      
      return await apiRequestManager.executeRequest(
        cacheKey,
        async () => {
          console.log(`🔌 ZohoRepository: CONNECTIVITY WEBHOOK CALL - Checking API connectivity`);
          
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
        5 * 60 * 1000, // 5 minute TTL for connectivity checks
        30000   // 30 second cooldown
      );
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const zohoRepository = new ZohoRepository();
