import { startOfMonth, endOfMonth, differenceInDays, addDays } from 'date-fns';
import { CacheSource } from '@/services/cache/types';
import CacheService from '@/services/cache';

export interface QueryPlan {
  useFullCache: boolean;
  usePartialCache: boolean;
  requiresApiCall: boolean;
  cacheRanges: Array<{ startDate: Date; endDate: Date }>;
  apiRanges: Array<{ startDate: Date; endDate: Date }>;
  estimatedCacheHitRatio: number;
}

export interface DataFreshnessConfig {
  transactional: number; // hours
  balance: number; // hours
  aggregated: number; // hours
}

/**
 * Service for optimizing data queries and creating execution plans
 */
class QueryOptimizerService {
  private freshnessConfig: DataFreshnessConfig = {
    transactional: 12, // 12 hours for transaction data
    balance: 2,        // 2 hours for balance data
    aggregated: 6      // 6 hours for aggregated data
  };

  /**
   * Create an optimized query plan for a date range
   */
  async createQueryPlan(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    dataType: keyof DataFreshnessConfig = 'transactional'
  ): Promise<QueryPlan> {
    console.log(`QueryOptimizer: Creating plan for ${source} from ${startDate} to ${endDate}`);

    try {
      // Check cache coverage for the entire range
      const cacheResponse = await CacheService.checkCache(source, startDate, endDate);
      console.log(`QueryOptimizer: Cache response:`, {
        cached: cacheResponse.cached,
        partial: cacheResponse.partial,
        missingRanges: cacheResponse.missingRanges,
        missingRangesType: typeof cacheResponse.missingRanges
      });
      
      // Determine data freshness requirements
      const maxAgeHours = this.freshnessConfig[dataType];
      const isDataFresh = this.isDataFreshEnough(cacheResponse, maxAgeHours);
      
      // Create execution plan based on cache status
      const plan = this.buildExecutionPlan(
        startDate,
        endDate,
        cacheResponse,
        isDataFresh
      );

      console.log(`QueryOptimizer: Plan created`, {
        source,
        useFullCache: plan.useFullCache,
        usePartialCache: plan.usePartialCache,
        requiresApiCall: plan.requiresApiCall,
        estimatedCacheHitRatio: plan.estimatedCacheHitRatio
      });

      return plan;
    } catch (error) {
      console.error('QueryOptimizer: Error creating query plan:', error);
      return this.createFallbackPlan(startDate, endDate);
    }
  }

  /**
   * Build execution plan based on cache analysis
   */
  private buildExecutionPlan(
    startDate: Date,
    endDate: Date,
    cacheResponse: any,
    isDataFresh: boolean
  ): QueryPlan {
    // If fully cached and fresh, use cache only
    if (cacheResponse.cached && !cacheResponse.partial && isDataFresh) {
      return {
        useFullCache: true,
        usePartialCache: false,
        requiresApiCall: false,
        cacheRanges: [{ startDate, endDate }],
        apiRanges: [],
        estimatedCacheHitRatio: 1.0
      };
    }

    // If partially cached, create hybrid plan
    if (cacheResponse.cached && cacheResponse.partial) {
      const apiRanges = this.extractMissingRanges(cacheResponse.missingRanges || []);
      const cacheRanges = this.extractCachedRanges(startDate, endDate, apiRanges);
      
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const cachedDays = cacheRanges.reduce((sum, range) => 
        sum + differenceInDays(range.endDate, range.startDate) + 1, 0
      );
      
      return {
        useFullCache: false,
        usePartialCache: true,
        requiresApiCall: apiRanges.length > 0,
        cacheRanges,
        apiRanges,
        estimatedCacheHitRatio: cachedDays / totalDays
      };
    }

    // If not cached or stale, use API only
    return {
      useFullCache: false,
      usePartialCache: false,
      requiresApiCall: true,
      cacheRanges: [],
      apiRanges: [{ startDate, endDate }],
      estimatedCacheHitRatio: 0.0
    };
  }

  /**
   * Check if cached data is fresh enough
   */
  private isDataFreshEnough(cacheResponse: any, maxAgeHours: number): boolean {
    if (!cacheResponse.metrics?.timestamp) {
      return false;
    }

    const cacheAge = (Date.now() - new Date(cacheResponse.metrics.timestamp).getTime()) / (1000 * 60 * 60);
    return cacheAge <= maxAgeHours;
  }

  /**
   * Extract missing date ranges with safe validation
   */
  private extractMissingRanges(missingRanges: any): Array<{ startDate: Date; endDate: Date }> {
    try {
      // Defensive validation - ensure missingRanges is an array
      if (!missingRanges) {
        console.log('QueryOptimizer: missingRanges is null/undefined, returning empty array');
        return [];
      }
      
      if (!Array.isArray(missingRanges)) {
        console.warn('QueryOptimizer: missingRanges is not an array:', typeof missingRanges, missingRanges);
        return [];
      }
      
      return missingRanges.map(range => {
        if (!range || typeof range !== 'object') {
          console.warn('QueryOptimizer: Invalid range object:', range);
          return null;
        }
        
        try {
          return {
            startDate: new Date(range.startDate),
            endDate: new Date(range.endDate)
          };
        } catch (dateError) {
          console.warn('QueryOptimizer: Error parsing date range:', range, dateError);
          return null;
        }
      }).filter(range => range !== null);
    } catch (error) {
      console.error('QueryOptimizer: Error extracting missing ranges:', error);
      return [];
    }
  }

  /**
   * Extract cached date ranges (inverse of missing ranges)
   */
  private extractCachedRanges(
    startDate: Date,
    endDate: Date,
    missingRanges: Array<{ startDate: Date; endDate: Date }>
  ): Array<{ startDate: Date; endDate: Date }> {
    if (missingRanges.length === 0) {
      return [{ startDate, endDate }];
    }

    const cachedRanges: Array<{ startDate: Date; endDate: Date }> = [];
    let currentDate = startDate;

    for (const missingRange of missingRanges.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())) {
      if (currentDate < missingRange.startDate) {
        cachedRanges.push({
          startDate: currentDate,
          endDate: addDays(missingRange.startDate, -1)
        });
      }
      currentDate = addDays(missingRange.endDate, 1);
    }

    if (currentDate <= endDate) {
      cachedRanges.push({ startDate: currentDate, endDate });
    }

    return cachedRanges;
  }

  /**
   * Create fallback plan when analysis fails
   */
  private createFallbackPlan(startDate: Date, endDate: Date): QueryPlan {
    return {
      useFullCache: false,
      usePartialCache: false,
      requiresApiCall: true,
      cacheRanges: [],
      apiRanges: [{ startDate, endDate }],
      estimatedCacheHitRatio: 0.0
    };
  }

  /**
   * Optimize date range for monthly cache alignment
   */
  optimizeDateRangeForCache(startDate: Date, endDate: Date): {
    optimizedStart: Date;
    optimizedEnd: Date;
    alignedToMonths: boolean;
  } {
    const monthStart = startOfMonth(startDate);
    const monthEnd = endOfMonth(endDate);
    
    // Check if alignment would significantly expand the range
    const originalDays = differenceInDays(endDate, startDate) + 1;
    const alignedDays = differenceInDays(monthEnd, monthStart) + 1;
    const expansionRatio = alignedDays / originalDays;
    
    // Only align if expansion is reasonable (less than 2x)
    if (expansionRatio <= 2.0) {
      return {
        optimizedStart: monthStart,
        optimizedEnd: monthEnd,
        alignedToMonths: true
      };
    }
    
    return {
      optimizedStart: startDate,
      optimizedEnd: endDate,
      alignedToMonths: false
    };
  }

  /**
   * Update freshness configuration
   */
  updateFreshnessConfig(config: Partial<DataFreshnessConfig>): void {
    this.freshnessConfig = { ...this.freshnessConfig, ...config };
    console.log('QueryOptimizer: Updated freshness config:', this.freshnessConfig);
  }

  /**
   * Get current freshness configuration
   */
  getFreshnessConfig(): DataFreshnessConfig {
    return { ...this.freshnessConfig };
  }
}

export const queryOptimizerService = new QueryOptimizerService();
