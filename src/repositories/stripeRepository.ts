
import { Transaction } from "../types/financial";
import StripeService from "../services/stripeService";
import CacheService from "../services/cache";

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
 * StripeRepository handles all data access related to Stripe,
 * including fetching data from API and cache management
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
      return await StripeService.checkApiConnectivity();
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const stripeRepository = new StripeRepository();
