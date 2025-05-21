
import { supabase } from "../../../integrations/supabase/client";

/**
 * CacheStatsMetrics provides basic statistics about the cache
 */
export class CacheStatsMetrics {
  /**
   * Get basic cache statistics
   */
  async getCacheStats() {
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
  }
}

export const cacheStatsMetrics = new CacheStatsMetrics();
