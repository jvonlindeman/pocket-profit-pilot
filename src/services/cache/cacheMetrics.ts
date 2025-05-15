
import { supabase } from "@/integrations/supabase/client";
import { CacheStats } from "./cacheTypes";

/**
 * Functions for retrieving cache metrics and statistics
 */
export const cacheMetrics = {
  /**
   * Get cache statistics for admin dashboard
   */
  getCacheStats: async (): Promise<CacheStats> => {
    try {
      // Get total cached transactions
      const { count: transactionCount, error: countError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Get cache segments stats  
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('cache_segments')
        .select('source, transaction_count');
      
      if (segmentsError) throw segmentsError;
      
      // Process segments data manually to group by source
      const segments = segmentsData.reduce((acc: any, curr) => {
        if (!acc[curr.source]) {
          acc[curr.source] = { count: 0, total: 0 };
        }
        acc[curr.source].count++;
        acc[curr.source].total += curr.transaction_count;
        return acc;
      }, {});
      
      const segmentsSummary = Object.entries(segments).map(([source, data]: [string, any]) => ({
        source,
        count: data.count,
        total: data.total
      }));
      
      // Get recent cache metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('cache_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (metricsError) throw metricsError;
      
      // Calculate hit rate manually
      const { data: hitRateData, error: hitRateError } = await supabase
        .from('cache_metrics')
        .select('cache_hit');
      
      if (hitRateError) throw hitRateError;
      
      let hits = 0;
      let misses = 0;
      
      hitRateData.forEach(item => {
        if (item.cache_hit) {
          hits++;
        } else {
          misses++;
        }
      });
      
      const hitRate = hits + misses > 0 ? (hits / (hits + misses) * 100).toFixed(1) + '%' : 'N/A';
      
      return {
        transactionCount,
        segments: segmentsSummary,
        recentMetrics: metrics,
        hitRate,
        hits,
        misses,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      console.error("CacheMetrics: Error getting cache stats:", err);
      return {
        transactionCount: 0,
        segments: [],
        recentMetrics: [],
        hitRate: 'N/A',
        hits: 0,
        misses: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  },

  /**
   * Get detailed cache statistics
   */
  getCacheDetailedStats: async (): Promise<{
    transactions: { source: string; count: number }[];
    segments: { source: string; count: number }[];
  }> => {
    try {
      // Get transaction counts by source
      const { data: txData, error: txError } = await supabase
        .from('cached_transactions')
        .select('source');
      
      if (txError) {
        console.error("CacheMetrics: Error getting transaction stats:", txError);
        return { transactions: [], segments: [] };
      }
      
      // Manually count transactions by source
      const txCountMap = new Map<string, number>();
      if (txData) {
        txData.forEach(record => {
          const source = record.source;
          txCountMap.set(source, (txCountMap.get(source) || 0) + 1);
        });
      }
      
      const transactions = Array.from(txCountMap.entries()).map(([source, count]) => ({
        source,
        count
      }));
      
      // Get segment counts by source using the same approach
      const { data: segData, error: segError } = await supabase
        .from('cache_segments')
        .select('source');
      
      if (segError) {
        console.error("CacheMetrics: Error getting segment stats:", segError);
        return { 
          transactions, 
          segments: [] 
        };
      }
      
      // Manually count segments by source
      const segCountMap = new Map<string, number>();
      if (segData) {
        segData.forEach(record => {
          const source = record.source;
          segCountMap.set(source, (segCountMap.get(source) || 0) + 1);
        });
      }
      
      const segments = Array.from(segCountMap.entries()).map(([source, count]) => ({
        source,
        count
      }));
      
      return {
        transactions,
        segments
      };
    } catch (err) {
      console.error("CacheMetrics: Error in getCacheDetailedStats", err);
      return { transactions: [], segments: [] };
    }
  }
};
