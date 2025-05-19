
import { supabase } from "../../integrations/supabase/client";
import { CacheStats } from "./types";

/**
 * CacheMetrics provides functionality for analyzing cache performance
 */
export class CacheMetrics {
  /**
   * Get cache statistics for admin dashboard
   */
  async getCacheStats(): Promise<Partial<CacheStats> & { lastUpdated: string }> {
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

  /**
   * Verify cache integrity for a date range
   */
  async verifyCacheIntegrity(
    source: string,
    startDate: string,
    endDate: string
  ): Promise<{
    isConsistent: boolean;
    segmentCount: number;
    transactionCount: number;
  }> {
    try {
      // Count segments
      const { count: segmentCount, error: segmentError } = await supabase
        .from('cache_segments')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .lte('start_date', startDate)
        .gte('end_date', endDate)
        .eq('status', 'complete');
        
      if (segmentError) {
        console.error("Error counting cache segments:", segmentError);
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      // Count transactions
      const { count: transactionCount, error: txError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (txError) {
        console.error("Error counting cache transactions:", txError);
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      // Check consistency
      const isConsistent = segmentCount > 0 && transactionCount > 0;
      
      return {
        isConsistent,
        segmentCount: segmentCount || 0,
        transactionCount: transactionCount || 0
      };
    } catch (err) {
      console.error("Exception verifying cache integrity:", err);
      return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
    }
  }
}

export const cacheMetrics = new CacheMetrics();
