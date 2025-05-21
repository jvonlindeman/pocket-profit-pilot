
import { CacheSource } from "../../../types";
import { StatsBaseRepository } from "./statsBase";

/**
 * Repository for monthly cache statistics operations
 */
export class MonthlyStatsRepository extends StatsBaseRepository {
  /**
   * Get monthly cache entries by source
   */
  async getMonthlyEntriesBySource(): Promise<Record<string, any[]>> {
    try {
      // Get all monthly cache entries
      const { data, error } = await this.getClient()
        .from('monthly_cache')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) {
        this.logStatError("Error getting monthly cache entries", error);
        return {};
      }
      
      // Group by source
      const entriesBySource: Record<string, any[]> = {};
      if (data) {
        data.forEach(item => {
          if (!entriesBySource[item.source]) {
            entriesBySource[item.source] = [];
          }
          entriesBySource[item.source].push(item);
        });
      }
      
      return entriesBySource;
    } catch (err) {
      this.logStatError("Exception getting monthly cache entries", err);
      return {};
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
        this.logStatError("Error clearing monthly cache", error);
        return false;
      }
      
      return true;
    } catch (err) {
      this.logStatError("Exception clearing monthly cache", err);
      return false;
    }
  }

  /**
   * Delete monthly cache data for a date range
   */
  async deleteMonthlyCache(source?: CacheSource, startDate?: string, endDate?: string): Promise<boolean> {
    if (!startDate || !endDate) {
      return true; // Nothing to delete
    }

    try {
      const startYear = parseInt(startDate.split('-')[0]);
      const startMonth = parseInt(startDate.split('-')[1]);
      const endYear = parseInt(endDate.split('-')[0]);
      const endMonth = parseInt(endDate.split('-')[1]);

      // Handle case where we might be deleting monthly cache from multiple months
      if (startYear === endYear) {
        // Same year, check if same or different months
        let query = this.getClient()
          .from('monthly_cache')
          .delete()
          .eq('year', startYear)
          .gte('month', startMonth)
          .lte('month', endMonth);
          
        if (source) {
          query = query.eq('source', source);
        }
        
        const { error } = await query;
        
        if (error) {
          this.logStatError("Error clearing monthly cache for date range", error);
          return false;
        }
      } else {
        // Different years, more complex query
        // Get all monthly cache entries in the range
        const { data, error } = await this.getClient()
          .from('monthly_cache')
          .select('id')
          .or(`year.gt.${startYear},and(year.eq.${startYear},month.gte.${startMonth})`)
          .or(`year.lt.${endYear},and(year.eq.${endYear},month.lte.${endMonth})`);
          
        if (error) {
          this.logStatError("Error finding monthly cache entries to delete", error);
          return false;
        }
        
        if (data && data.length > 0) {
          const ids = data.map(entry => entry.id);
          const { error: deleteError } = await this.getClient()
            .from('monthly_cache')
            .delete()
            .in('id', ids);
            
          if (deleteError) {
            this.logStatError("Error deleting monthly cache entries", deleteError);
            return false;
          }
        }
      }
      
      return true;
    } catch (err) {
      this.logStatError("Exception deleting monthly cache for date range", err);
      return false;
    }
  }
}

export const monthlyStatsRepository = new MonthlyStatsRepository();
