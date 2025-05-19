
import { CacheDbClient } from "./client";
import { CacheSourceStats, DetailedCacheStats } from "../types";

/**
 * StatsRepository handles all statistics-related database operations
 */
export class StatsRepository extends CacheDbClient {
  /**
   * Get detailed cache statistics
   */
  async getDetailedStats(): Promise<DetailedCacheStats> {
    try {
      // Get count of Zoho transactions
      const { count: zohoCount, error: zohoError } = await this.getClient()
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'Zoho');
      
      // Get count of Stripe transactions
      const { count: stripeCount, error: stripeError } = await this.getClient()
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'Stripe');
        
      if (zohoError || stripeError) {
        this.logError("Error getting transaction stats", zohoError || stripeError);
        return { 
          transactions: [], 
          segments: [], 
          recentMetrics: [], 
          hitRate: 'N/A', 
          hits: 0, 
          misses: 0, 
          lastUpdated: new Date().toISOString() 
        };
      }
      
      // Format transaction counts
      const transactions: CacheSourceStats[] = [
        { source: 'Zoho', count: zohoCount || 0 },
        { source: 'Stripe', count: stripeCount || 0 }
      ];
      
      // Get count of Zoho segments
      const { count: zohoSegmentCount, error: zohoSegmentError } = await this.getClient()
        .from('cache_segments')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'Zoho');
        
      // Get count of Stripe segments
      const { count: stripeSegmentCount, error: stripeSegmentError } = await this.getClient()
        .from('cache_segments')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'Stripe');
        
      if (zohoSegmentError || stripeSegmentError) {
        this.logError("Error getting segment stats", zohoSegmentError || stripeSegmentError);
        return { 
          transactions, 
          segments: [], 
          recentMetrics: [], 
          hitRate: 'N/A', 
          hits: 0, 
          misses: 0, 
          lastUpdated: new Date().toISOString() 
        };
      }
      
      // Format segment counts
      const segments: CacheSourceStats[] = [
        { source: 'Zoho', count: zohoSegmentCount || 0 },
        { source: 'Stripe', count: stripeSegmentCount || 0 }
      ];
      
      // Get recent cache metrics
      const { data: metrics, error: metricsError } = await this.getClient()
        .from('cache_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (metricsError) {
        this.logError("Error getting metrics", metricsError);
      }
      
      // Calculate hit rate manually
      const { data: hitRateData, error: hitRateError } = await this.getClient()
        .from('cache_metrics')
        .select('cache_hit');
      
      if (hitRateError) {
        this.logError("Error calculating hit rate", hitRateError);
      }
      
      let hits = 0;
      let misses = 0;
      
      if (hitRateData) {
        hitRateData.forEach(item => {
          if (item.cache_hit) {
            hits++;
          } else {
            misses++;
          }
        });
      }
      
      const hitRate = hits + misses > 0 ? (hits / (hits + misses) * 100).toFixed(1) + '%' : 'N/A';
      
      return {
        transactions,
        segments,
        recentMetrics: metrics || [],
        hitRate,
        hits,
        misses,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      this.logError("Exception getting cache stats", err);
      return {
        transactions: [],
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
   * Delete cached transactions
   */
  async deleteTransactions(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      let txQuery = this.getClient().from('cached_transactions').delete();
      
      if (source) {
        txQuery = txQuery.eq('source', source);
      }
      
      if (startDate && endDate) {
        txQuery = txQuery
          .gte('date', startDate)
          .lte('date', endDate);
      }
      
      const { error } = await txQuery;
      
      if (error) {
        this.logError("Error clearing cached transactions", error);
        return false;
      }
      
      return true;
    } catch (err) {
      this.logError("Exception clearing cached transactions", err);
      return false;
    }
  }
}

export const statsRepository = new StatsRepository();
