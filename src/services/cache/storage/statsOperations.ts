
import { DetailedCacheStats, CacheSource } from "../types";
import { statsRepository } from "../db/stats";

/**
 * Functions for managing cache statistics
 */
export const statsOperations = {
  /**
   * Clear monthly cache (wrapper for clearCacheOperations)
   */
  async clearMonthlyCache(
    source?: CacheSource,
    year?: number,
    month?: number
  ): Promise<boolean> {
    return statsRepository.clearMonthlyCache(source, year, month);
  },

  /**
   * Delete transactions (wrapper for clearCacheOperations)
   */
  async deleteTransactions(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    return statsRepository.deleteTransactions(source, startDate, endDate);
  },

  /**
   * Get detailed cache statistics
   */
  async getDetailedStats(): Promise<DetailedCacheStats> {
    return statsRepository.getDetailedStats();
  }
};
