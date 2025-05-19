
import { CacheDbClient } from "./client";
import { CacheSourceStats, DetailedCacheStats, CacheSource } from "../types";

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
      
      // Get count of monthly cache entries for Zoho
      const { data: zohoMonthlyData, error: zohoMonthlyError } = await this.getClient()
        .from('monthly_cache')
        .select('*', { count: 'exact' })
        .eq('source', 'Zoho');
        
      // Get count of monthly cache entries for Stripe
      const { data: stripeMonthlyData, error: stripeMonthlyError } = await this.getClient()
        .from('monthly_cache')
        .select('*', { count: 'exact' })
        .eq('source', 'Stripe');
        
      if (zohoMonthlyError || stripeMonthlyError) {
        this.logError("Error getting monthly cache stats", zohoMonthlyError || stripeMonthlyError);
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
      
      // Format monthly cache counts
      const segments: CacheSourceStats[] = [
        { source: 'Zoho', count: zohoMonthlyData?.length || 0 },
        { source: 'Stripe', count: stripeMonthlyData?.length || 0 }
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

      // Also clear monthly cache entries if we're deleting transactions
      if (startDate && endDate) {
        const startYear = parseInt(startDate.split('-')[0]);
        const startMonth = parseInt(startDate.split('-')[1]);
        const endYear = parseInt(endDate.split('-')[0]);
        const endMonth = parseInt(endDate.split('-')[1]);

        // Handle case where we might be deleting transactions from multiple months
        let monthlyQuery = this.getClient().from('monthly_cache').delete();

        if (source) {
          monthlyQuery = monthlyQuery.eq('source', source);
        }

        // We'll need a more complex query to handle multi-month ranges
        if (startYear === endYear) {
          // Same year, check if same or different months
          monthlyQuery = monthlyQuery
            .eq('year', startYear)
            .gte('month', startMonth)
            .lte('month', endMonth);
        } else {
          // Different years, need to use OR logic which is more complex in Supabase
          // For now, fetch and delete manually
          const { data: monthsToDelete } = await this.getClient()
            .from('monthly_cache')
            .select('*')
            .or(`year.gt.${startYear},and(year.eq.${startYear},month.gte.${startMonth})`)
            .or(`year.lt.${endYear},and(year.eq.${endYear},month.lte.${endMonth})`);
          
          if (monthsToDelete && monthsToDelete.length > 0) {
            const ids = monthsToDelete.map(m => m.id);
            const { error: deleteError } = await this.getClient()
              .from('monthly_cache')
              .delete()
              .in('id', ids);
              
            if (deleteError) {
              this.logError("Error clearing monthly cache entries", deleteError);
            }
          }
          
          return true;
        }
        
        const { error: monthlyError } = await monthlyQuery;
        
        if (monthlyError) {
          this.logError("Error clearing monthly cache", monthlyError);
        }
      }
      
      return true;
    } catch (err) {
      this.logError("Exception clearing cached transactions", err);
      return false;
    }
  }

  /**
   * Clear monthly cache
   */
  async clearMonthlyCache(source?: CacheSource, year?: number, month?: number): Promise<boolean> {
    try {
      let query = this.getClient().from('monthly_cache').delete();
      
      if (source) {
        query = query.eq('source', source);
      }
      
      if (year) {
        query = query.eq('year', year);
      }
      
      if (month) {
        query = query.eq('month', month);
      }
      
      const { error } = await query;
      
      if (error) {
        this.logError("Error clearing monthly cache", error);
        return false;
      }
      
      return true;
    } catch (err) {
      this.logError("Exception clearing monthly cache", err);
      return false;
    }
  }
}

export const statsRepository = new StatsRepository();
