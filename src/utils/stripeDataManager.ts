import { stripeRepository } from "@/repositories/stripeRepository";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * Utility for managing Stripe data operations
 * Simplified without persistent cache - React Query handles caching
 */
export class StripeDataManager {
  /**
   * Force refresh Stripe data for a specific month
   */
  static async forceRefreshMonth(year: number, month: number): Promise<{
    success: boolean;
    transactionCount: number;
    error?: string;
  }> {
    try {
      console.log(`StripeDataManager: Force refreshing Stripe data for ${year}/${month}`);
      
      // Create date range for the month
      const startDate = startOfMonth(new Date(year, month - 1, 1));
      const endDate = endOfMonth(startDate);
      
      console.log(`StripeDataManager: Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Force refresh data through repository
      const result = await stripeRepository.getTransactions(startDate, endDate, true);
      
      console.log(`StripeDataManager: Retrieved ${result.transactions.length} transactions`);
      
      return {
        success: true,
        transactionCount: result.transactions.length
      };
    } catch (error) {
      console.error("StripeDataManager: Error during force refresh:", error);
      return {
        success: false,
        transactionCount: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  /**
   * Check if a specific month has Stripe data
   * Since we don't use persistent cache, this always returns false for hasPersistentData
   */
  static async checkMonthData(year: number, month: number): Promise<{
    hasPersistentData: boolean;
    transactionCount: number;
  }> {
    // Without persistent cache, we can't check historical data status
    return {
      hasPersistentData: false,
      transactionCount: 0
    };
  }
  
  /**
   * Get summary of cached Stripe data by month
   * Returns empty since we don't use persistent cache
   */
  static async getCachedDataSummary(): Promise<Array<{
    month: string;
    transactionCount: number;
    hasData: boolean;
  }>> {
    // Without persistent cache, return empty summary
    return [];
  }
}
