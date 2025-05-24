
import { Transaction } from '@/types/financial';
import { CacheSource } from '@/services/cache/types';
import { cacheIntelligenceService, CacheAnalysis } from './cacheIntelligence';
import CacheService from '@/services/cache';
import { stripeRepository } from '@/repositories/stripeRepository';
import { zohoRepository } from '@/repositories/zohoRepository';

export interface HybridFetchResult {
  transactions: Transaction[];
  dataSource: 'cache' | 'api' | 'hybrid';
  cacheHitRatio: number;
  freshness: 'fresh' | 'stale' | 'mixed';
  apiCallsMade: number;
}

/**
 * Hybrid service that intelligently chooses between cache and API
 */
class HybridDataService {
  /**
   * Fetch transactions with intelligent cache-first strategy
   */
  async fetchTransactions(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<HybridFetchResult> {
    console.log(`HybridDataService: Fetching ${source} transactions with intelligent strategy`);
    
    if (forceRefresh) {
      console.log('HybridDataService: Force refresh requested, skipping cache analysis');
      return this.fetchFromApi(source, startDate, endDate);
    }

    // Analyze cache status
    const analysis = await cacheIntelligenceService.analyzeCacheStatus(
      source,
      startDate,
      endDate,
      'transactional'
    );

    console.log(`HybridDataService: Cache analysis result:`, analysis);

    // Execute strategy based on analysis
    switch (analysis.recommendedAction) {
      case 'use_cache':
        return this.fetchFromCache(source, startDate, endDate, analysis);
      
      case 'refresh_partial':
        return this.fetchHybrid(source, startDate, endDate, analysis);
      
      case 'refresh_full':
      default:
        return this.fetchFromApi(source, startDate, endDate);
    }
  }

  /**
   * Fetch exclusively from cache
   */
  private async fetchFromCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    analysis: CacheAnalysis
  ): Promise<HybridFetchResult> {
    console.log(`HybridDataService: Fetching ${source} from cache only`);
    
    const cacheResponse = await CacheService.checkCache(source, startDate, endDate);
    
    return {
      transactions: cacheResponse.data || [],
      dataSource: 'cache',
      cacheHitRatio: 1.0,
      freshness: analysis.isStale ? 'stale' : 'fresh',
      apiCallsMade: 0
    };
  }

  /**
   * Fetch exclusively from API
   */
  private async fetchFromApi(
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<HybridFetchResult> {
    console.log(`HybridDataService: Fetching ${source} from API only`);
    
    let transactions: Transaction[] = [];
    let apiCallsMade = 0;

    try {
      if (source === 'Stripe') {
        const stripeData = await stripeRepository.getTransactions(startDate, endDate, true);
        transactions = stripeData.transactions;
        apiCallsMade = 1;
      } else if (source === 'Zoho') {
        transactions = await zohoRepository.getTransactions(startDate, endDate, true);
        apiCallsMade = 1;
      }

      // Store in cache for future use
      await this.storeInCache(source, startDate, endDate, transactions);

    } catch (error) {
      console.error(`HybridDataService: Error fetching from ${source} API:`, error);
      // Fallback to cache if API fails
      const cacheResponse = await CacheService.checkCache(source, startDate, endDate);
      transactions = cacheResponse.data || [];
    }

    return {
      transactions,
      dataSource: 'api',
      cacheHitRatio: 0.0,
      freshness: 'fresh',
      apiCallsMade
    };
  }

  /**
   * Fetch using hybrid approach (cache + API for missing parts)
   */
  private async fetchHybrid(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    analysis: CacheAnalysis
  ): Promise<HybridFetchResult> {
    console.log(`HybridDataService: Using hybrid approach for ${source}`);
    
    let allTransactions: Transaction[] = [];
    let apiCallsMade = 0;
    let cacheTransactionCount = 0;

    // First, get cached data
    const cacheResponse = await CacheService.checkCache(source, startDate, endDate);
    if (cacheResponse.data) {
      allTransactions = [...cacheResponse.data];
      cacheTransactionCount = allTransactions.length;
      console.log(`HybridDataService: Got ${cacheTransactionCount} transactions from cache`);
    }

    // Then, fetch missing ranges from API
    for (const missingRange of analysis.missingRanges) {
      try {
        console.log(`HybridDataService: Fetching missing range from API:`, missingRange);
        
        let newTransactions: Transaction[] = [];
        
        if (source === 'Stripe') {
          const stripeData = await stripeRepository.getTransactions(
            missingRange.startDate,
            missingRange.endDate,
            true
          );
          newTransactions = stripeData.transactions;
        } else if (source === 'Zoho') {
          newTransactions = await zohoRepository.getTransactions(
            missingRange.startDate,
            missingRange.endDate,
            true
          );
        }

        // Merge new transactions
        allTransactions = [...allTransactions, ...newTransactions];
        apiCallsMade++;

        // Store new data in cache
        await this.storeInCache(source, missingRange.startDate, missingRange.endDate, newTransactions);

      } catch (error) {
        console.error(`HybridDataService: Error fetching missing range:`, error);
      }
    }

    // Remove duplicates and sort
    allTransactions = this.deduplicateTransactions(allTransactions);

    const totalTransactions = allTransactions.length;
    const cacheHitRatio = totalTransactions > 0 ? cacheTransactionCount / totalTransactions : 0;

    return {
      transactions: allTransactions,
      dataSource: 'hybrid',
      cacheHitRatio,
      freshness: analysis.isStale ? 'mixed' : 'fresh',
      apiCallsMade
    };
  }

  /**
   * Store transactions in cache
   */
  private async storeInCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<void> {
    try {
      await CacheService.storeTransactions(source, startDate, endDate, transactions);
      console.log(`HybridDataService: Stored ${transactions.length} transactions in cache`);
    } catch (error) {
      console.error('HybridDataService: Error storing transactions in cache:', error);
    }
  }

  /**
   * Remove duplicate transactions based on external_id and date
   */
  private deduplicateTransactions(transactions: Transaction[]): Transaction[] {
    const seen = new Set<string>();
    return transactions.filter(transaction => {
      const key = `${transaction.id}-${transaction.date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const hybridDataService = new HybridDataService();
