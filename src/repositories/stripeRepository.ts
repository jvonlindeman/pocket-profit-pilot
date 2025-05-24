
import { Transaction } from "../types/financial";
import StripeService from "../services/stripeService";
import { apiRequestManager } from "@/utils/ApiRequestManager";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { useApiCalls } from "@/contexts/ApiCallsContext";
import CacheService from "@/services/cache";

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
 * Simplified to avoid redundant caching layers
 */
export class StripeRepository {
  private apiCallsContext?: ReturnType<typeof useApiCalls>;
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
   * Get transactions for a date range - simplified without redundant caching
   */
  async getTransactions(
    startDate: Date,
    endDate: Date, 
    forceRefresh = false
  ): Promise<StripeResult> {
    try {
      const cacheKey = `stripe-data-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
      
      console.log(`StripeRepository: Getting transactions for ${cacheKey}, forceRefresh: ${forceRefresh}`);
      
      // Check if there's already a request in progress
      if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
        console.log(`StripeRepository: Reusing in-progress request for ${cacheKey}`);
        return await this.inProgressRequestsMap.get(cacheKey)!;
      }
      
      // If we're forcing a refresh, clear any existing in-progress request
      if (forceRefresh) {
        console.log("StripeRepository: Force refresh requested, clearing in-progress requests");
        this.inProgressRequestsMap.delete(cacheKey);
      }
      
      // Create and store the promise
      const requestPromise = this.executeRequest(startDate, endDate, forceRefresh);
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
   * Execute the actual request with automatic persistent storage
   */
  private async executeRequest(
    startDate: Date, 
    endDate: Date, 
    forceRefresh: boolean
  ): Promise<StripeResult> {
    console.log(`StripeRepository: Making API call for ${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`);
    
    this.trackApiCall();
    const result = await StripeService.getTransactions(startDate, endDate, forceRefresh);
    
    // Store data in persistent cache immediately after successful API call
    if (result.transactions && result.transactions.length > 0) {
      console.log(`StripeRepository: Storing ${result.transactions.length} transactions in persistent cache`);
      
      try {
        const storeResult = await CacheService.storeTransactions('Stripe', startDate, endDate, result.transactions);
        
        if (storeResult) {
          console.log("StripeRepository: Successfully stored transactions in persistent cache");
        } else {
          console.error("StripeRepository: Failed to store transactions in persistent cache");
        }
      } catch (storeError) {
        console.error("StripeRepository: Exception storing transactions in persistent cache:", storeError);
      }
    } else {
      console.log("StripeRepository: No transactions to store in persistent cache");
    }
    
    return {
      transactions: result.transactions,
      gross: result.gross,
      fees: result.fees,
      transactionFees: result.transactionFees,
      payoutFees: result.payoutFees,
      additionalFees: result.stripeFees || 0,
      net: result.net,
      feePercentage: result.feePercentage
    };
  }

  /**
   * Check if API is accessible
   */
  async checkApiConnectivity(): Promise<boolean> {
    try {
      console.log("StripeRepository: Checking API connectivity");
      this.trackApiCall();
      return await StripeService.checkApiConnectivity();
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
