
import { DetailedCacheStats, CacheSource, CacheSourceStats } from "../types";
import { supabase } from "../../../integrations/supabase/client";

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
    // This will be implemented via the imported clearCacheOperations
    // in the storage/index.ts file to avoid circular dependencies
    return false;
  },

  /**
   * Delete transactions (wrapper for clearCacheOperations)
   */
  async deleteTransactions(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    // This will be implemented via the imported clearCacheOperations
    // in the storage/index.ts file to avoid circular dependencies
    return false;
  },

  /**
   * Get detailed cache statistics
   */
  async getDetailedStats(): Promise<DetailedCacheStats> {
    try {
      // Get monthly cache stats
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_cache')
        .select('source, year, month, transaction_count, status')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (monthlyError) {
        console.error("Error getting monthly cache stats:", monthlyError);
      }
      
      // Get segment stats
      const { data: segmentData, error: segmentError } = await supabase
        .from('cache_segments')
        .select('source, start_date, end_date, transaction_count, status')
        .order('start_date', { ascending: false });
      
      if (segmentError) {
        console.error("Error getting segment stats:", segmentError);
      }
      
      // Get cached transaction counts by source
      const { data: sourceCountData, error: txError } = await supabase
        .from('cached_transactions')
        .select('source')
        .limit(1000000); // Use high limit to get all (or at least most) records
      
      // Process the data to count by source manually
      const sourceCounts: Record<string, number> = {};
      if (sourceCountData) {
        sourceCountData.forEach(item => {
          if (!sourceCounts[item.source]) {
            sourceCounts[item.source] = 0;
          }
          sourceCounts[item.source]++;
        });
      }
      
      if (txError) {
        console.error("Error getting transaction counts:", txError);
      }
      
      // Get transaction counts by month - this needs to be processed manually
      const { data: monthlyTransactions, error: txByMonthError } = await supabase
        .from('cached_transactions')
        .select('source, year, month')
        .limit(1000000); // Use high limit
      
      // Process monthly transactions
      const countsByMonthAndSource: Record<string, Record<string, number>> = {};
      if (monthlyTransactions) {
        for (const item of monthlyTransactions) {
          if (item.year && item.month) {
            const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
            if (!countsByMonthAndSource[key]) {
              countsByMonthAndSource[key] = {};
            }
            if (!countsByMonthAndSource[key][item.source]) {
              countsByMonthAndSource[key][item.source] = 0;
            }
            countsByMonthAndSource[key][item.source]++;
          }
        }
      }
      
      if (txByMonthError) {
        console.error("Error getting transaction counts by month:", txByMonthError);
      }
      
      // Calculate size metrics
      let totalTransactions = 0;
      
      // Sum up the counts from our manually processed data
      Object.values(sourceCounts).forEach(count => {
        totalTransactions += count;
      });
      
      // Group monthly cache by source
      const monthlyBySource: Record<string, any[]> = {};
      if (monthlyData) {
        monthlyData.forEach(item => {
          if (!monthlyBySource[item.source]) {
            monthlyBySource[item.source] = [];
          }
          monthlyBySource[item.source].push(item);
        });
      }
      
      // Group segments by source
      const segmentsBySource: Record<string, any[]> = {};
      if (segmentData) {
        segmentData.forEach(item => {
          if (!segmentsBySource[item.source]) {
            segmentsBySource[item.source] = [];
          }
          segmentsBySource[item.source].push(item);
        });
      }
      
      // Create the source stats array with the correct structure
      const sourceStats: CacheSourceStats[] = Object.entries(sourceCounts).map(([source, count]) => {
        return {
          source,
          count,
          monthlyData: monthlyBySource[source] || [],
          segments: segmentsBySource[source] || []
        };
      });
      
      return {
        totalTransactions,
        transactionsBySource: sourceCounts,
        monthlyCache: monthlyBySource,
        segments: segmentsBySource,
        transactionsByMonth: countsByMonthAndSource,
        sourcesStats: sourceStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      console.error("Error getting detailed cache stats:", err);
      // Return empty stats with the correct structure
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
};
