
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
      const { data: txCounts, error: txError } = await supabase
        .from('cached_transactions')
        .select('source, count')
        .select('source, count(*)')
        .then(result => {
          // Process the result manually to extract counts
          return {
            ...result,
            data: result.data?.map(item => ({
              source: item.source,
              count: parseInt(String(item.count))
            }))
          };
        });
      
      if (txError) {
        console.error("Error getting transaction counts:", txError);
      }
      
      // Get transaction counts by month
      const { data: txByMonth, error: txByMonthError } = await supabase
        .from('cached_transactions')
        .select('source, year, month')
        .then(async (result) => {
          // Process the data to get counts manually
          if (result.data) {
            const countsByMonthAndSource: Record<string, Record<string, number>> = {};
            
            for (const item of result.data) {
              const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
              if (!countsByMonthAndSource[key]) {
                countsByMonthAndSource[key] = {};
              }
              if (!countsByMonthAndSource[key][item.source]) {
                countsByMonthAndSource[key][item.source] = 0;
              }
              countsByMonthAndSource[key][item.source]++;
            }
            
            return {
              ...result,
              data: countsByMonthAndSource
            };
          }
          return result;
        });
      
      if (txByMonthError) {
        console.error("Error getting transaction counts by month:", txByMonthError);
      }
      
      // Calculate size metrics
      let totalTransactions = 0;
      let sourceCounts: Record<string, number> = {};
      
      if (txCounts?.data) {
        txCounts.data.forEach(item => {
          sourceCounts[item.source] = item.count;
          totalTransactions += item.count;
        });
      }
      
      // Group monthly cache by source and month
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
      
      // Process transaction counts by month from our manually processed data
      const txByMonthAndSource = txByMonth?.data || {};
      
      // Create the cache stats result object with the correct data structure
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
        transactionsByMonth: txByMonthAndSource,
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
