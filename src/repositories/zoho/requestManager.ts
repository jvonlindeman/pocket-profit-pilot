
import { Transaction } from "../../types/financial";
import { formatDateYYYYMMDD } from "../../utils/dateUtils";
import { ZohoCacheOperations } from "./cacheOperations";
import { ZohoApiOperations } from "./apiOperations";

/**
 * Manages request deduplication and coordination between cache and API operations
 */
export class ZohoRequestManager {
  private inProgressRequestsMap: Map<string, Promise<any>> = new Map();
  private cacheOps: ZohoCacheOperations;
  private apiOps: ZohoApiOperations;

  constructor(cacheOps: ZohoCacheOperations, apiOps: ZohoApiOperations) {
    this.cacheOps = cacheOps;
    this.apiOps = apiOps;
  }

  /**
   * Execute transactions request with deduplication
   */
  async executeTransactionsRequest(
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<Transaction[]> {
    // Generate a cache key for deduplication
    const cacheKey = `zoho-transactions-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
    
    // Check if there's already a request in progress with this key
    if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
      console.log(`♻️ ZohoRequestManager: Reusing in-progress request for ${cacheKey}`);
      return await this.inProgressRequestsMap.get(cacheKey)!;
    }
    
    // Create and store the promise
    const requestPromise = this.performTransactionsRequest(cacheKey, startDate, endDate, forceRefresh);
    this.inProgressRequestsMap.set(cacheKey, requestPromise);
    
    // Execute the request and clean up after
    try {
      return await requestPromise;
    } finally {
      // Clean up after the request is done
      this.inProgressRequestsMap.delete(cacheKey);
    }
  }

  /**
   * Execute raw response request with deduplication
   */
  async executeRawResponseRequest(
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<any> {
    // Generate a cache key for deduplication
    const cacheKey = `zoho-raw-response-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
    
    // Check if there's already a request in progress with this key
    if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
      console.log(`♻️ ZohoRequestManager: Reusing in-progress raw request for ${cacheKey}`);
      return await this.inProgressRequestsMap.get(cacheKey)!;
    }
    
    // Create and store the promise
    const requestPromise = this.apiOps.executeRawResponseRequest(cacheKey, startDate, endDate, forceRefresh);
    this.inProgressRequestsMap.set(cacheKey, requestPromise);
    
    // Execute the request and clean up after
    try {
      return await requestPromise;
    } finally {
      // Clean up after the request is done
      this.inProgressRequestsMap.delete(cacheKey);
    }
  }

  /**
   * Perform the actual transactions request
   */
  private async performTransactionsRequest(
    cacheKey: string,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<Transaction[]> {
    // Handle force refresh
    if (forceRefresh) {
      console.log(`🔄 ZohoRequestManager: Force refresh requested - Clearing cache and calling webhook`);
      await this.cacheOps.clearCache(startDate, endDate);
    } else {
      // **CACHE-FIRST APPROACH**: Check cache before making any API calls
      console.log(`📦 ZohoRequestManager: Checking cache first for ${cacheKey}`);
      
      const cacheResult = await this.cacheOps.checkCacheAvailability(startDate, endDate);
      
      if (cacheResult.cached && cacheResult.transactions) {
        return cacheResult.transactions;
      }
    }
    
    // Only reach here if cache miss or force refresh
    console.log(`🌐 ZohoRequestManager: Cache miss or force refresh - Making webhook call`);
    
    const transactions = await this.apiOps.executeTransactionsRequest(cacheKey, startDate, endDate, forceRefresh);
    
    // Store in cache after successful fetch
    await this.cacheOps.storeTransactions(startDate, endDate, transactions);
    
    return transactions;
  }
}
