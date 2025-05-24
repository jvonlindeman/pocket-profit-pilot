
import { Transaction } from "../types/financial";
import StripeService from "../services/stripeService";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
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
 * StripeRepository - SIMPLIFIED to avoid duplicate API calls
 */
export class StripeRepository {
  private inProgressRequestsMap: Map<string, Promise<any>> = new Map();

  /**
   * Get transactions for a date range - SIMPLIFIED without redundant layers
   */
  async getTransactions(
    startDate: Date,
    endDate: Date, 
    forceRefresh = false
  ): Promise<StripeResult> {
    try {
      const cacheKey = `stripe-data-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
      
      console.log(`StripeRepository: Getting transactions for ${cacheKey}, forceRefresh: ${forceRefresh}`);
      
      // Check if there's already a request in progress for this exact key
      if (this.inProgressRequestsMap.has(cacheKey) && !forceRefresh) {
        console.log(`StripeRepository: Reusing in-progress request for ${cacheKey}`);
        return await this.inProgressRequestsMap.get(cacheKey)!;
      }
      
      // If we're forcing a refresh, clear any existing in-progress request
      if (forceRefresh) {
        console.log("StripeRepository: Force refresh requested, clearing in-progress requests");
        this.inProgressRequestsMap.delete(cacheKey);
      }
      
      // Create and store the promise to prevent duplicate calls
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
   * Execute the actual request - ONLY makes API call, no caching here
   */
  private async executeRequest(
    startDate: Date, 
    endDate: Date, 
    forceRefresh: boolean
  ): Promise<StripeResult> {
    console.log(`StripeRepository: Making API call for ${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`);
    
    // Call StripeService directly - no redundant caching
    const result = await StripeService.getTransactions(startDate, endDate, forceRefresh);
    
    // Store data in persistent cache after successful API call
    if (result.transactions && result.transactions.length > 0) {
      console.log(`StripeRepository: Storing ${result.transactions.length} transactions in persistent cache`);
      
      try {
        await CacheService.storeTransactions('Stripe', startDate, endDate, result.transactions);
        console.log("StripeRepository: Successfully stored transactions in persistent cache");
      } catch (storeError) {
        console.error("StripeRepository: Exception storing transactions in persistent cache:", storeError);
      }
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
