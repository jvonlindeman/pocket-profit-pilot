import { CacheSource } from '@/services/cache/types';
import CacheService from '@/services/cache';
import { addHours, differenceInHours } from 'date-fns';

export interface DataFreshnessConfig {
  transactional: number; // hours
  balance: number; // hours
  aggregated: number; // hours
}

export interface CacheAnalysis {
  fullyCached: boolean;
  partiallyCached: boolean;
  missingRanges: Array<{ startDate: Date; endDate: Date }>;
  cacheAge: number; // hours since last update
  isStale: boolean;
  recommendedAction: 'use_cache' | 'refresh_partial' | 'refresh_full';
}

/**
 * Service for intelligent cache management and data freshness
 */
class CacheIntelligenceService {
  private freshnessConfig: DataFreshnessConfig = {
    transactional: 12, // 12 hours for transaction data
    balance: 2,        // 2 hours for balance data
    aggregated: 6      // 6 hours for aggregated data
  };

  /**
   * Analyze cache coverage and freshness for a date range
   */
  async analyzeCacheStatus(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    dataType: keyof DataFreshnessConfig = 'transactional'
  ): Promise<CacheAnalysis> {
    try {
      console.log(`CacheIntelligence: Analyzing ${source} cache for ${dataType} data`);
      
      // Check cache status
      const cacheResponse = await CacheService.checkCache(source, startDate, endDate);
      console.log(`CacheIntelligence: Cache response received:`, {
        cached: cacheResponse.cached,
        partial: cacheResponse.partial,
        missingRanges: cacheResponse.missingRanges,
        missingRangesType: typeof cacheResponse.missingRanges,
        missingRangesIsArray: Array.isArray(cacheResponse.missingRanges)
      });
      
      // Determine cache age and staleness
      const maxAge = this.freshnessConfig[dataType];
      const cacheAge = this.estimateCacheAge(cacheResponse);
      const isStale = cacheAge > maxAge;
      
      // Analyze coverage with safe missing ranges extraction
      const analysis: CacheAnalysis = {
        fullyCached: cacheResponse.cached && !cacheResponse.partial,
        partiallyCached: cacheResponse.cached && cacheResponse.partial,
        missingRanges: this.extractMissingRanges(cacheResponse.missingRanges || []),
        cacheAge,
        isStale,
        recommendedAction: this.determineRecommendedAction(cacheResponse, isStale)
      };
      
      console.log(`CacheIntelligence: Analysis result:`, {
        source,
        dataType,
        fullyCached: analysis.fullyCached,
        isStale: analysis.isStale,
        action: analysis.recommendedAction,
        missingRangesCount: analysis.missingRanges.length
      });
      
      return analysis;
    } catch (error) {
      console.error('CacheIntelligence: Error analyzing cache status:', error);
      return {
        fullyCached: false,
        partiallyCached: false,
        missingRanges: [{ startDate, endDate }],
        cacheAge: Infinity,
        isStale: true,
        recommendedAction: 'refresh_full'
      };
    }
  }

  /**
   * Determine the best action based on cache analysis
   */
  private determineRecommendedAction(
    cacheResponse: any,
    isStale: boolean
  ): CacheAnalysis['recommendedAction'] {
    if (!cacheResponse.cached) {
      return 'refresh_full';
    }
    
    if (isStale) {
      return cacheResponse.partial ? 'refresh_partial' : 'refresh_full';
    }
    
    if (cacheResponse.partial) {
      return 'refresh_partial';
    }
    
    return 'use_cache';
  }

  /**
   * Estimate cache age in hours
   */
  private estimateCacheAge(cacheResponse: any): number {
    // If we have metrics with timestamp, use that
    if (cacheResponse.metrics?.timestamp) {
      return differenceInHours(new Date(), new Date(cacheResponse.metrics.timestamp));
    }
    
    // Otherwise, assume moderate age for cached data
    return cacheResponse.cached ? 6 : Infinity;
  }

  /**
   * Extract missing date ranges that need to be fetched
   * Safely handles cases where missingRanges is not an array
   */
  private extractMissingRanges(missingRanges: any): Array<{ startDate: Date; endDate: Date }> {
    try {
      // Defensive validation - ensure missingRanges is an array
      if (!missingRanges) {
        console.log('CacheIntelligence: missingRanges is null/undefined, returning empty array');
        return [];
      }
      
      if (!Array.isArray(missingRanges)) {
        console.warn('CacheIntelligence: missingRanges is not an array:', typeof missingRanges, missingRanges);
        return [];
      }
      
      return missingRanges.map(range => {
        if (!range || typeof range !== 'object') {
          console.warn('CacheIntelligence: Invalid range object:', range);
          return null;
        }
        
        try {
          return {
            startDate: new Date(range.startDate),
            endDate: new Date(range.endDate)
          };
        } catch (dateError) {
          console.warn('CacheIntelligence: Error parsing date range:', range, dateError);
          return null;
        }
      }).filter(range => range !== null);
    } catch (error) {
      console.error('CacheIntelligence: Error extracting missing ranges:', error);
      return [];
    }
  }

  /**
   * Check if data is fresh enough to use without API call
   */
  isDataFresh(
    cacheAge: number,
    dataType: keyof DataFreshnessConfig = 'transactional'
  ): boolean {
    return cacheAge <= this.freshnessConfig[dataType];
  }

  /**
   * Update freshness configuration
   */
  updateFreshnessConfig(config: Partial<DataFreshnessConfig>): void {
    this.freshnessConfig = { ...this.freshnessConfig, ...config };
    console.log('CacheIntelligence: Updated freshness config:', this.freshnessConfig);
  }

  /**
   * Get current freshness configuration
   */
  getFreshnessConfig(): DataFreshnessConfig {
    return { ...this.freshnessConfig };
  }
}

export const cacheIntelligenceService = new CacheIntelligenceService();
