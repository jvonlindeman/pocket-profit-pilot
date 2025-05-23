
import { Transaction } from "../types/financial";
import StripeService from "../services/stripeService";
import { apiRequestManager } from "@/utils/ApiRequestManager";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";

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
  /**
   * Get transactions for a date range
   */
  async getTransactions(
    startDate: Date,
    endDate: Date, 
    forceRefresh = false
  ): Promise<StripeResult> {
    try {
      // Generate a cache key for this request
      const cacheKey = `stripe-transactions-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}-${forceRefresh}`;
      
      // If we're forcing a refresh, clear any existing cache entry
      if (forceRefresh) {
        apiRequestManager.clearCacheEntry(cacheKey);
      }
      
      // Use ApiRequestManager to deduplicate requests
      return await apiRequestManager.executeRequest(
        cacheKey,
        async () => {
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
        forceRefresh ? 0 : 5 * 60 * 1000 // 5 minutes TTL, or 0 if force refresh
      );
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
   * Check if API is accessible
   */
  async checkApiConnectivity(): Promise<boolean> {
    try {
      // Generate a cache key for this connectivity check
      const cacheKey = `stripe-connectivity-${Date.now()}`;
      
      // Use ApiRequestManager to deduplicate requests
      return await apiRequestManager.executeRequest(
        cacheKey,
        async () => {
          return await StripeService.checkApiConnectivity();
        },
        30000 // 30 second TTL for connectivity checks
      );
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const stripeRepository = new StripeRepository();
