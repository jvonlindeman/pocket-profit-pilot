
import { stripeRepository } from "@/repositories/stripeRepository";
import CacheService from "@/services/cache";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * Utility for managing Stripe data and cache operations
 */
export class StripeDataManager {
  /**
   * Force refresh and store Stripe data for a specific month
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
      
      // Clear any existing cache for this period
      await CacheService.clearCache({
        source: 'Stripe',
        startDate: startDate,
        endDate: endDate
      });
      
      // Force refresh data through repository (this will automatically store in persistent cache)
      const result = await stripeRepository.getTransactions(startDate, endDate, true);
      
      console.log(`StripeDataManager: Retrieved ${result.transactions.length} transactions`);
      
      // Verify data was stored in persistent cache
      const verificationCheck = await CacheService.checkCache('Stripe', startDate, endDate);
      
      if (verificationCheck.cached && verificationCheck.data && verificationCheck.data.length > 0) {
        console.log(`StripeDataManager: Successfully verified ${verificationCheck.data.length} transactions in persistent cache`);
        return {
          success: true,
          transactionCount: verificationCheck.data.length
        };
      } else {
        console.error("StripeDataManager: Data was not properly stored in persistent cache");
        return {
          success: false,
          transactionCount: 0,
          error: "Data was not stored in persistent cache"
        };
      }
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
   * Check if a specific month has Stripe data in persistent cache
   */
  static async checkMonthData(year: number, month: number): Promise<{
    hasPersistentData: boolean;
    transactionCount: number;
  }> {
    try {
      const startDate = startOfMonth(new Date(year, month - 1, 1));
      const endDate = endOfMonth(startDate);
      
      const cacheCheck = await CacheService.checkCache('Stripe', startDate, endDate);
      
      return {
        hasPersistentData: cacheCheck.cached && (cacheCheck.data?.length || 0) > 0,
        transactionCount: cacheCheck.data?.length || 0
      };
    } catch (error) {
      console.error("StripeDataManager: Error checking month data:", error);
      return {
        hasPersistentData: false,
        transactionCount: 0
      };
    }
  }
  
  /**
   * Get summary of all cached Stripe data by month
   */
  static async getCachedDataSummary(): Promise<Array<{
    month: string;
    transactionCount: number;
    hasData: boolean;
  }>> {
    const summary = [];
    const currentYear = new Date().getFullYear();
    
    // Check last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthData = await this.checkMonthData(year, month);
      
      summary.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        transactionCount: monthData.transactionCount,
        hasData: monthData.hasPersistentData
      });
    }
    
    return summary.reverse(); // Oldest first
  }
}
