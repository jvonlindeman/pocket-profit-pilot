
import { CacheSource, CacheSourceStats, DetailedCacheStats } from "../../types";
import { transactionStatsRepository } from "./transactionStats";
import { monthlyStatsRepository } from "./monthlyStats";
import { segmentStatsRepository } from "./segmentStats";

/**
 * StatsRepository integrates all statistics repositories
 * to provide a unified API for statistics operations
 */
export class StatsRepository {
  /**
   * Get detailed cache statistics
   */
  async getDetailedStats(): Promise<DetailedCacheStats> {
    try {
      // Get transaction counts by source
      const transactionsBySource = await transactionStatsRepository.getTransactionCounts();
      
      // Get monthly cache entries by source
      const monthlyCache = await monthlyStatsRepository.getMonthlyEntriesBySource();
      
      // Get cache segments by source
      const segments = await segmentStatsRepository.getSegmentsBySource();
      
      // Get transaction counts by month and source
      const transactionsByMonth = await transactionStatsRepository.getTransactionCountsByMonth();
      
      // Calculate total transactions
      const totalTransactions = Object.values(transactionsBySource).reduce((sum, count) => sum + count, 0);
      
      // Create source stats array with the correct structure
      const sourceStats: CacheSourceStats[] = Object.entries(transactionsBySource).map(([source, count]) => {
        return {
          source,
          count,
          monthlyData: monthlyCache[source] || [],
          segments: segments[source] || []
        };
      });
      
      return {
        totalTransactions,
        transactionsBySource,
        monthlyCache,
        segments,
        transactionsByMonth,
        sourcesStats: sourceStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      console.error("Error getting detailed cache stats:", err);
      return {
        totalTransactions: 0,
        transactionsBySource: {},
        monthlyCache: {},
        segments: {},
        transactionsByMonth: {},
        sourcesStats: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Clear monthly cache
   */
  async clearMonthlyCache(source?: CacheSource, year?: number, month?: number): Promise<boolean> {
    return monthlyStatsRepository.clearMonthlyCache(source, year, month);
  }

  /**
   * Delete transactions
   */
  async deleteTransactions(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      // First delete transactions
      const txDeleted = await transactionStatsRepository.deleteTransactions(
        source, 
        startDate, 
        endDate
      );
      
      if (!txDeleted) {
        return false;
      }
      
      // Also clear monthly cache entries if we're deleting transactions
      if (startDate && endDate) {
        await monthlyStatsRepository.deleteMonthlyCache(source, startDate, endDate);
      }
      
      // Also clear segments
      await segmentStatsRepository.deleteSegments(source, startDate, endDate);
      
      return true;
    } catch (err) {
      console.error("Exception clearing cached data:", err);
      return false;
    }
  }
}

export const statsRepository = new StatsRepository();
