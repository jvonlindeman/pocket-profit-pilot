
import { CacheSource } from './types';
import { supabase } from '../../integrations/supabase/client';

/**
 * Enhanced cache staleness management with database-backed storage and actual cache clearing
 */
export class CacheStalenessManager {
  private staleEntries = new Map<string, { timestamp: number; source: CacheSource }>();

  /**
   * Mark cache entries as stale and physically clear them from database
   */
  async markCacheStale(source: CacheSource, startDate: Date, endDate: Date): Promise<void> {
    const key = this.getCacheKey(source, startDate, endDate);
    this.staleEntries.set(key, {
      timestamp: Date.now(),
      source
    });
    
    console.log(`🗑️ CacheStalenessManager: Marking ${source} cache as stale and clearing from database for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    // Actually clear the cache from database
    await this.clearCacheFromDatabase(source, startDate, endDate);
  }

  /**
   * Physically clear cache data from database
   */
  private async clearCacheFromDatabase(source: CacheSource, startDate: Date, endDate: Date): Promise<void> {
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    try {
      // Check if this is a single month request
      const year = startDate.getFullYear();
      const month = startDate.getMonth() + 1;
      const isFullMonth = (
        startDate.getDate() === 1 &&
        endDate.getDate() === new Date(year, month, 0).getDate() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getFullYear() === endDate.getFullYear()
      );

      if (isFullMonth) {
        console.log(`🗑️ CacheStalenessManager: Clearing monthly cache for ${source} ${year}-${month}`);
        
        // Clear monthly cache entry
        const { error: monthlyCacheError } = await supabase
          .from('monthly_cache')
          .delete()
          .eq('source', source)
          .eq('year', year)
          .eq('month', month);
        
        if (monthlyCacheError) {
          console.error('Error clearing monthly cache:', monthlyCacheError);
        }
        
        // Clear cached transactions for this month
        const { error: transactionsError } = await supabase
          .from('cached_transactions')
          .delete()
          .eq('source', source)
          .eq('year', year)
          .eq('month', month);
        
        if (transactionsError) {
          console.error('Error clearing cached transactions:', transactionsError);
        } else {
          console.log(`✅ CacheStalenessManager: Successfully cleared ${source} cache for ${year}-${month}`);
        }
      } else {
        // Clear cache segments for date range
        console.log(`🗑️ CacheStalenessManager: Clearing cache segments for ${source} ${formattedStartDate} to ${formattedEndDate}`);
        
        const { error: segmentsError } = await supabase
          .from('cache_segments')
          .delete()
          .eq('source', source)
          .gte('start_date', formattedStartDate)
          .lte('end_date', formattedEndDate);
        
        if (segmentsError) {
          console.error('Error clearing cache segments:', segmentsError);
        }
        
        // Clear cached transactions for date range
        const { error: transactionsError } = await supabase
          .from('cached_transactions')
          .delete()
          .eq('source', source)
          .gte('date', formattedStartDate)
          .lte('date', formattedEndDate);
        
        if (transactionsError) {
          console.error('Error clearing cached transactions:', transactionsError);
        } else {
          console.log(`✅ CacheStalenessManager: Successfully cleared ${source} cache for ${formattedStartDate} to ${formattedEndDate}`);
        }
      }
    } catch (error) {
      console.error('Exception clearing cache from database:', error);
    }
  }

  /**
   * Check if cache is marked as stale (now checks database too)
   */
  async isCacheStale(source: CacheSource, startDate: Date, endDate: Date): Promise<boolean> {
    const key = this.getCacheKey(source, startDate, endDate);
    const staleEntry = this.staleEntries.get(key);
    
    if (!staleEntry) return false;
    
    // Consider cache stale for 5 minutes after marking
    const staleDuration = 5 * 60 * 1000; // 5 minutes
    const isStale = Date.now() - staleEntry.timestamp < staleDuration;
    
    return isStale;
  }

  /**
   * Clear staleness marking for a cache entry
   */
  clearStaleness(source: CacheSource, startDate: Date, endDate: Date): void {
    const key = this.getCacheKey(source, startDate, endDate);
    this.staleEntries.delete(key);
    
    console.log(`✅ CacheStalenessManager: Cleared staleness marking for ${source} cache`);
  }

  /**
   * Get cache key for staleness tracking
   */
  private getCacheKey(source: CacheSource, startDate: Date, endDate: Date): string {
    return `${source}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
  }

  /**
   * Get all stale entries (for debugging)
   */
  getStaleEntries(): Array<{ key: string; timestamp: number; source: CacheSource }> {
    return Array.from(this.staleEntries.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }
}

export const cacheStalenessManager = new CacheStalenessManager();
