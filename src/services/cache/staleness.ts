
import { CacheSource } from './types';
import { supabase } from '../../integrations/supabase/client';

/**
 * Cache staleness management for smart refresh operations
 */
export class CacheStalenessManager {
  private staleEntries = new Map<string, { timestamp: number; source: CacheSource }>();

  /**
   * Mark cache entries as stale for a date range
   */
  markCacheStale(source: CacheSource, startDate: Date, endDate: Date): void {
    const key = this.getCacheKey(source, startDate, endDate);
    this.staleEntries.set(key, {
      timestamp: Date.now(),
      source
    });
    
    console.log(`🕐 CacheStalenessManager: Marked ${source} cache as stale for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  }

  /**
   * Check if cache is marked as stale
   */
  isCacheStale(source: CacheSource, startDate: Date, endDate: Date): boolean {
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
    
    console.log(`✅ CacheStalenessManager: Cleared staleness for ${source} cache`);
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
