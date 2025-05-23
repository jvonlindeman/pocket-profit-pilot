
import { Transaction } from "../types/financial";
import StripeService from "../services/stripeService";
import { apiRequestManager } from "@/utils/ApiRequestManager";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { useApiCalls } from "@/contexts/ApiCallsContext";

/**
 * Interface for Stripe data results that includes transactions and aggregate data
 */
export interface StripeResult {
  transactions: Transaction[];
  gross: number;
  fees: number;
  transactionFees: number;
  payoutFees: number;
  additionalFees: number;
  net: number;
  feePercentage: number;
}

/**
 * StripeRepository handles all data access related to Stripe
 */
export class StripeRepository {
  private apiCallsContext?: ReturnType<typeof useApiCalls>;
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
      this.apiCallsContext.incrementStripeApiCalls();
    }
  }

  /**
   * Get transactions for a date range with improved deduplication
   */
  async getTransactions(
    startDate: Date,
    endDate: Date, 
    forceRefresh = false
  ): Promise<StripeResult> {
    try {
      // Generate a simplified cache key for this request - only use date range
      const cacheKey = `stripe-data-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
      
      console.log(`StripeRepository: Using cache key ${cacheKey}, forceRefresh: ${forceRefresh}`);
      
      // Store the last request key for deduplication
      this.lastRequestKey = cacheKey;
      
      // Check if there's already a request in progress with this key
      if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
        console.log(`StripeRepository: Reusing in-progress request for ${cacheKey}`);
        return await this.inProgressRequestsMap.get(cacheKey)!;
      }
      
      // If we're forcing a refresh, clear any existing cache entry and in-progress request
      if (forceRefresh) {
        console.log("StripeRepository: Force refresh requested, clearing cache");
        apiRequestManager.clearCacheEntry(cacheKey);
        this.inProgressRequestsMap.delete(cacheKey);
      }
      
      // Create and store the promise
      const requestPromise = this.executeRequest(cacheKey, startDate, endDate, forceRefresh);
      this.inProgressRequestsMap.set(cacheKey, requestPromise);
      
      // Execute the request and clean up after
      try {
        return await requestPromise;
      } finally {
        // Clean up after the request is done
        this.inProgressRequestsMap.delete(cacheKey);
      }
    } catch (error) {
      console.error("Error in stripeRepository.getTransactions:", error);
      return {
        transactions: [],
        gross: 0,
        fees: 0,
        transactionFees: 0,
        payoutFees: 0,
        additionalFees: 0,
        net: 0,
        feePercentage: 0
      };
    }
  }
  
  /**
   * Execute the actual request with ApiRequestManager
   */
  private async executeRequest(
    cacheKey: string, 
    startDate: Date, 
    endDate: Date, 
    forceRefresh: boolean
  ): Promise<StripeResult> {
    return await apiRequestManager.executeRequest(
      cacheKey,
      async () => {
        console.log(`StripeRepository: Making actual API call for ${cacheKey}`);
        this.trackApiCall();
        const result = await StripeService.getTransactions(startDate, endDate, forceRefresh);
        return {
          transactions: result.transactions,
          gross: result.gross,
          fees: result.fees,
          transactionFees: result.transactionFees,
          payoutFees: result.payoutFees,
          additionalFees: result.stripeFees || 0, // Map stripeFees to additionalFees
          net: result.net,
          feePercentage: result.feePercentage
        };
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
      // Generate a cache key for this connectivity check with timestamp
      const cacheKey = `stripe-connectivity-check`;
      
      console.log("StripeRepository: Checking API connectivity");
      
      // Use ApiRequestManager to deduplicate requests with a longer cache time
      return await apiRequestManager.executeRequest(
        cacheKey,
        async () => {
          this.trackApiCall();
          return await StripeService.checkApiConnectivity();
        },
        60000, // 60 second TTL for connectivity checks (increased)
        5000   // 5 second cooldown
      );
    } catch {
      return false;
    }
  }
  
  /**
   * Get the last raw response for debugging
   */
  getLastRawResponse(): any {
    return StripeService.getLastRawResponse();
  }
}

// Export a singleton instance
export const stripeRepository = new StripeRepository();
