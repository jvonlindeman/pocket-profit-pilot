
import { stripeRepository } from "@/repositories/stripeRepository";
import { zohoRepository } from "@/repositories/zohoRepository";
import { apiRequestManager } from "@/utils/ApiRequestManager";
import { Transaction } from "@/types/financial";
import CacheService from "@/services/cache";

class DataFetcherService {
  private static instance: DataFetcherService;
  private lastRequestId: string = '';
  private inProgressRequests: Map<string, Promise<any>> = new Map();
  private lastRawResponse: any = null;

  // Singleton pattern
  public static getInstance(): DataFetcherService {
    if (!DataFetcherService.instance) {
      DataFetcherService.instance = new DataFetcherService();
    }
    return DataFetcherService.instance;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  }

  /**
   * Get a cache key based on date range
   */
  private getCacheKey(dataType: string, startDate: Date, endDate: Date): string {
    return `${dataType}-data-${startDate.getTime()}-${endDate.getTime()}`;
  }

  /**
   * Fetch Stripe data with deduplication
   */
  async fetchStripeData(
    startDate: Date, 
    endDate: Date, 
    forceRefresh = false
  ): Promise<any> {
    const requestId = this.generateRequestId();
    console.log(`DataFetcherService: Fetching Stripe data (${requestId})`);
    
    const cacheKey = this.getCacheKey('stripe', startDate, endDate);
    
    // Check if there's an in-progress request
    if (this.inProgressRequests.has(cacheKey) && !forceRefresh) {
      console.log(`DataFetcherService: Reusing in-progress Stripe request for ${cacheKey}`);
      return this.inProgressRequests.get(cacheKey);
    }
    
    // Create the promise for this request
    const requestPromise = this.executeStripeRequest(cacheKey, startDate, endDate, forceRefresh);
    this.inProgressRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      this.lastRawResponse = stripeRepository.getLastRawResponse();
      return result;
    } finally {
      // Clean up after the request is done
      this.inProgressRequests.delete(cacheKey);
    }
  }
  
  /**
   * Execute the actual Stripe request
   */
  private async executeStripeRequest(
    cacheKey: string, 
    startDate: Date, 
    endDate: Date, 
    forceRefresh: boolean
  ): Promise<any> {
    return apiRequestManager.executeRequest(
      cacheKey,
      async () => {
        console.log(`DataFetcherService: Making actual Stripe API call for ${cacheKey}`);
        return await stripeRepository.getTransactions(startDate, endDate, forceRefresh);
      },
      forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes TTL, or 0 if force refresh
      30000 // 30 second cooldown
    );
  }

  /**
   * Fetch Zoho data with deduplication
   */
  async fetchZohoData(
    startDate: Date, 
    endDate: Date, 
    forceRefresh = false
  ): Promise<Transaction[]> {
    const requestId = this.generateRequestId();
    console.log(`DataFetcherService: Fetching Zoho data (${requestId})`);
    
    const cacheKey = this.getCacheKey('zoho', startDate, endDate);
    
    // Check if there's an in-progress request
    if (this.inProgressRequests.has(cacheKey) && !forceRefresh) {
      console.log(`DataFetcherService: Reusing in-progress Zoho request for ${cacheKey}`);
      return this.inProgressRequests.get(cacheKey);
    }
    
    // Create the promise for this request
    const requestPromise = this.executeZohoRequest(cacheKey, startDate, endDate, forceRefresh);
    this.inProgressRequests.set(cacheKey, requestPromise);
    
    try {
      return await requestPromise;
    } finally {
      // Clean up after the request is done
      this.inProgressRequests.delete(cacheKey);
    }
  }
  
  /**
   * Execute the actual Zoho request
   */
  private async executeZohoRequest(
    cacheKey: string, 
    startDate: Date, 
    endDate: Date, 
    forceRefresh: boolean
  ): Promise<Transaction[]> {
    return apiRequestManager.executeRequest(
      cacheKey,
      async () => {
        console.log(`DataFetcherService: Making actual Zoho API call for ${cacheKey}`);
        return await zohoRepository.getTransactions(startDate, endDate, forceRefresh);
      },
      forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes TTL, or 0 if force refresh
      30000 // 30 second cooldown
    );
  }

  /**
   * Fetch all financial data (combined)
   */
  async fetchAllFinancialData(
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false,
    callbacks?: {
      onTransactions?: (transactions: Transaction[]) => void;
      onCollaboratorData?: (data: any) => void;
      onIncomeTypes?: (transactions: Transaction[], stripeData: any) => void;
    }
  ): Promise<boolean> {
    try {
      const requestId = this.generateRequestId();
      console.log(`DataFetcherService: Fetching all financial data (${requestId})`);
      
      // Fetch data from both sources in parallel
      const [stripeData, zohoTransactions] = await Promise.all([
        this.fetchStripeData(dateRange.startDate, dateRange.endDate, forceRefresh),
        this.fetchZohoData(dateRange.startDate, dateRange.endDate, forceRefresh)
      ]);
      
      // Process combined data
      const stripeTransactions = stripeData?.transactions || [];
      const allTransactions = [...zohoTransactions, ...stripeTransactions];
      
      // Call the callbacks if provided
      if (callbacks?.onTransactions) {
        callbacks.onTransactions(allTransactions);
      }
      
      if (callbacks?.onCollaboratorData) {
        const collaboratorData = zohoRepository.getCollaboratorExpenses();
        callbacks.onCollaboratorData(collaboratorData);
      }
      
      if (callbacks?.onIncomeTypes) {
        callbacks.onIncomeTypes(allTransactions, stripeData);
      }
      
      return true;
    } catch (error) {
      console.error("DataFetcherService: Error fetching all financial data:", error);
      return false;
    }
  }

  /**
   * Check API connectivity for both services
   */
  async checkApiConnectivity(): Promise<{
    zoho: boolean;
    stripe: boolean;
  }> {
    try {
      const [zohoConnected, stripeConnected] = await Promise.all([
        zohoRepository.checkApiConnectivity(),
        stripeRepository.checkApiConnectivity()
      ]);
      
      return {
        zoho: zohoConnected,
        stripe: stripeConnected
      };
    } catch (error) {
      console.error("DataFetcherService: Error checking API connectivity:", error);
      return {
        zoho: false,
        stripe: false
      };
    }
  }

  /**
   * Get the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse;
  }
  
  /**
   * Check cache status for a date range
   */
  async checkCacheStatus(dateRange: { startDate: Date; endDate: Date }): Promise<{
    zoho: { cached: boolean; partial: boolean };
    stripe: { cached: boolean; partial: boolean };
  }> {
    try {
      const [zohoCache, stripeCache] = await Promise.all([
        CacheService.checkCache('Zoho', dateRange.startDate, dateRange.endDate),
        CacheService.checkCache('Stripe', dateRange.startDate, dateRange.endDate)
      ]);
      
      return {
        zoho: { 
          cached: zohoCache.cached, 
          partial: zohoCache.partial || false 
        },
        stripe: { 
          cached: stripeCache.cached, 
          partial: stripeCache.partial || false 
        }
      };
    } catch (error) {
      console.error("DataFetcherService: Error checking cache status:", error);
      return {
        zoho: { cached: false, partial: false },
        stripe: { cached: false, partial: false }
      };
    }
  }
}

// Export a singleton instance
export const dataFetcherService = DataFetcherService.getInstance();
