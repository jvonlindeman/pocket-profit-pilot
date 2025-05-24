
import { addDays, startOfMonth, endOfMonth, isToday, isTomorrow } from 'date-fns';
import { CacheSource } from '@/services/cache/types';
import { hybridDataService } from './hybridDataService';
import { cacheIntelligenceService } from './cacheIntelligence';

export interface CacheWarmingStrategy {
  currentMonth: boolean;
  nextMonth: boolean;
  previousMonth: boolean;
  commonRanges: boolean;
}

/**
 * Service for predictive caching and cache warming
 */
class PredictiveCacheService {
  private warmingInProgress = new Set<string>();
  private lastWarmingTime = new Map<string, number>();
  private warmingCooldown = 60 * 60 * 1000; // 1 hour

  /**
   * Warm cache for commonly accessed date ranges
   */
  async warmCache(
    sources: CacheSource[] = ['Zoho', 'Stripe'],
    strategy: CacheWarmingStrategy = {
      currentMonth: true,
      nextMonth: false,
      previousMonth: true,
      commonRanges: true
    }
  ): Promise<void> {
    console.log('PredictiveCacheService: Starting cache warming');

    const warmingTasks: Promise<void>[] = [];

    for (const source of sources) {
      if (strategy.currentMonth) {
        warmingTasks.push(this.warmCurrentMonth(source));
      }
      
      if (strategy.previousMonth) {
        warmingTasks.push(this.warmPreviousMonth(source));
      }
      
      if (strategy.nextMonth) {
        warmingTasks.push(this.warmNextMonth(source));
      }
      
      if (strategy.commonRanges) {
        warmingTasks.push(this.warmCommonRanges(source));
      }
    }

    await Promise.allSettled(warmingTasks);
    console.log('PredictiveCacheService: Cache warming completed');
  }

  /**
   * Warm current month data
   */
  private async warmCurrentMonth(source: CacheSource): Promise<void> {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    
    await this.warmDateRange(source, startDate, endDate, 'current-month');
  }

  /**
   * Warm previous month data
   */
  private async warmPreviousMonth(source: CacheSource): Promise<void> {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startDate = startOfMonth(previousMonth);
    const endDate = endOfMonth(previousMonth);
    
    await this.warmDateRange(source, startDate, endDate, 'previous-month');
  }

  /**
   * Warm next month data (for planning purposes)
   */
  private async warmNextMonth(source: CacheSource): Promise<void> {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startDate = startOfMonth(nextMonth);
    const endDate = endOfMonth(nextMonth);
    
    await this.warmDateRange(source, startDate, endDate, 'next-month');
  }

  /**
   * Warm commonly accessed ranges
   */
  private async warmCommonRanges(source: CacheSource): Promise<void> {
    const now = new Date();
    
    // Last 7 days
    const last7DaysStart = addDays(now, -7);
    await this.warmDateRange(source, last7DaysStart, now, 'last-7-days');
    
    // Last 30 days
    const last30DaysStart = addDays(now, -30);
    await this.warmDateRange(source, last30DaysStart, now, 'last-30-days');
  }

  /**
   * Warm a specific date range
   */
  private async warmDateRange(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    rangeType: string
  ): Promise<void> {
    const warmingKey = `${source}-${rangeType}-${startDate.getTime()}-${endDate.getTime()}`;
    
    // Check if warming is already in progress
    if (this.warmingInProgress.has(warmingKey)) {
      console.log(`PredictiveCacheService: Warming already in progress for ${warmingKey}`);
      return;
    }

    // Check cooldown period
    const lastWarming = this.lastWarmingTime.get(warmingKey) || 0;
    if (Date.now() - lastWarming < this.warmingCooldown) {
      console.log(`PredictiveCacheService: Cooldown active for ${warmingKey}`);
      return;
    }

    try {
      this.warmingInProgress.add(warmingKey);
      this.lastWarmingTime.set(warmingKey, Date.now());

      console.log(`PredictiveCacheService: Warming ${source} cache for ${rangeType}`);

      // Check if data is already fresh enough
      const analysis = await cacheIntelligenceService.analyzeCacheStatus(
        source,
        startDate,
        endDate,
        'transactional'
      );

      // Only warm if cache needs refreshing
      if (analysis.recommendedAction !== 'use_cache') {
        await hybridDataService.fetchTransactions(source, startDate, endDate, false);
        console.log(`PredictiveCacheService: Successfully warmed ${source} cache for ${rangeType}`);
      } else {
        console.log(`PredictiveCacheService: Cache already warm for ${source} ${rangeType}`);
      }

    } catch (error) {
      console.error(`PredictiveCacheService: Error warming cache for ${warmingKey}:`, error);
    } finally {
      this.warmingInProgress.delete(warmingKey);
    }
  }

  /**
   * Schedule automatic cache warming
   */
  scheduleAutoWarmup(): void {
    // Warm cache every hour for current data
    setInterval(() => {
      this.warmCache(['Zoho', 'Stripe'], {
        currentMonth: true,
        nextMonth: false,
        previousMonth: false,
        commonRanges: true
      });
    }, 60 * 60 * 1000); // 1 hour

    // Warm cache for all data daily at 6 AM
    const now = new Date();
    const tomorrow6AM = new Date(now);
    tomorrow6AM.setDate(tomorrow6AM.getDate() + 1);
    tomorrow6AM.setHours(6, 0, 0, 0);
    
    const msUntil6AM = tomorrow6AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.warmCache(['Zoho', 'Stripe'], {
        currentMonth: true,
        nextMonth: true,
        previousMonth: true,
        commonRanges: true
      });
      
      // Then repeat daily
      setInterval(() => {
        this.warmCache(['Zoho', 'Stripe'], {
          currentMonth: true,
          nextMonth: true,
          previousMonth: true,
          commonRanges: true
        });
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, msUntil6AM);

    console.log('PredictiveCacheService: Scheduled automatic cache warming');
  }

  /**
   * Pre-warm cache for anticipated requests
   */
  async preWarmForRequest(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    console.log(`PredictiveCacheService: Pre-warming for anticipated request: ${source}`);
    
    // Warm the exact range
    await this.warmDateRange(source, startDate, endDate, 'anticipated');
    
    // Also warm adjacent periods that might be requested next
    const prevMonthStart = startOfMonth(addDays(startDate, -1));
    const prevMonthEnd = endOfMonth(addDays(startDate, -1));
    
    const nextMonthStart = startOfMonth(addDays(endDate, 1));
    const nextMonthEnd = endOfMonth(addDays(endDate, 1));
    
    // Warm adjacent months in background (don't await)
    this.warmDateRange(source, prevMonthStart, prevMonthEnd, 'adjacent-prev').catch(console.error);
    this.warmDateRange(source, nextMonthStart, nextMonthEnd, 'adjacent-next').catch(console.error);
  }

  /**
   * Get warming status
   */
  getWarmingStatus(): {
    inProgress: string[];
    lastWarmingTimes: Record<string, Date>;
  } {
    const lastWarmingTimes: Record<string, Date> = {};
    
    for (const [key, timestamp] of this.lastWarmingTime.entries()) {
      lastWarmingTimes[key] = new Date(timestamp);
    }
    
    return {
      inProgress: Array.from(this.warmingInProgress),
      lastWarmingTimes
    };
  }

  /**
   * Clear warming state (for testing/debugging)
   */
  clearWarmingState(): void {
    this.warmingInProgress.clear();
    this.lastWarmingTime.clear();
    console.log('PredictiveCacheService: Cleared warming state');
  }
}

export const predictiveCacheService = new PredictiveCacheService();
