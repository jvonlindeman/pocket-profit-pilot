import { hybridDataService, HybridFetchResult } from './hybridDataService';
import { Transaction } from '@/types/financial';
import { stripeRepository } from '@/repositories/stripeRepository';
import { zohoRepository } from '@/repositories/zohoRepository';
import { cacheIntelligenceService } from './cacheIntelligence';
import { queryOptimizerService, QueryPlan } from './queryOptimizer';
import { predictiveCacheService } from './predictiveCacheService';

export interface SmartFetchResult {
  success: boolean;
  zohoResult: HybridFetchResult;
  stripeResult: HybridFetchResult;
  totalTransactions: number;
  cacheEfficiency: number;
  apiCallsSaved: number;
  queryPlans: {
    zoho: QueryPlan;
    stripe: QueryPlan;
  };
  optimizationApplied: boolean;
}

/**
 * Enhanced smart data fetcher that prioritizes database over APIs
 */
class SmartDataFetcherService {
  private static instance: SmartDataFetcherService;

  public static getInstance(): SmartDataFetcherService {
    if (!SmartDataFetcherService.instance) {
      SmartDataFetcherService.instance = new SmartDataFetcherService();
    }
    return SmartDataFetcherService.instance;
  }

  constructor() {
    // Initialize predictive caching
    this.initializePredictiveCaching();
  }

  /**
   * Initialize predictive caching system
   */
  private initializePredictiveCaching(): void {
    // Schedule automatic cache warming
    predictiveCacheService.scheduleAutoWarmup();
    
    // Initial warm-up for current month
    predictiveCacheService.warmCache(['Zoho', 'Stripe'], {
      currentMonth: true,
      nextMonth: false,
      previousMonth: true,
      commonRanges: true
    }).catch(error => {
      console.error('SmartDataFetcherService: Error in initial cache warming:', error);
    });
  }

  /**
   * Fetch all financial data using intelligent cache-first strategy with query optimization
   */
  async fetchAllFinancialData(
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false,
    callbacks?: {
      onTransactions?: (transactions: Transaction[]) => void;
      onCollaboratorData?: (data: any) => void;
      onIncomeTypes?: (transactions: Transaction[], stripeData: any) => void;
    }
  ): Promise<SmartFetchResult> {
    console.log('SmartDataFetcherService: Starting optimized intelligent data fetch');
    
    try {
      // Step 1: Create query plans for both sources
      const [zohoQueryPlan, stripeQueryPlan] = await Promise.all([
        queryOptimizerService.createQueryPlan('Zoho', dateRange.startDate, dateRange.endDate),
        queryOptimizerService.createQueryPlan('Stripe', dateRange.startDate, dateRange.endDate)
      ]);

      console.log('SmartDataFetcherService: Query plans created', {
        zoho: {
          useFullCache: zohoQueryPlan.useFullCache,
          requiresApiCall: zohoQueryPlan.requiresApiCall,
          cacheHitRatio: zohoQueryPlan.estimatedCacheHitRatio
        },
        stripe: {
          useFullCache: stripeQueryPlan.useFullCache,
          requiresApiCall: stripeQueryPlan.requiresApiCall,
          cacheHitRatio: stripeQueryPlan.estimatedCacheHitRatio
        }
      });

      // Step 2: Pre-warm cache if beneficial
      if (!forceRefresh) {
        await this.preWarmIfBeneficial(dateRange, zohoQueryPlan, stripeQueryPlan);
      }

      // Step 3: Execute optimized data fetching
      const [zohoResult, stripeResult] = await Promise.all([
        this.executeOptimizedFetch('Zoho', dateRange, zohoQueryPlan, forceRefresh),
        this.executeOptimizedFetch('Stripe', dateRange, stripeQueryPlan, forceRefresh)
      ]);

      // Step 4: Combine and process results
      const allTransactions = [...zohoResult.transactions, ...stripeResult.transactions];
      
      // Calculate efficiency metrics
      const totalApiCallsPossible = 2;
      const actualApiCalls = zohoResult.apiCallsMade + stripeResult.apiCallsMade;
      const apiCallsSaved = totalApiCallsPossible - actualApiCalls;
      const cacheEfficiency = totalApiCallsPossible > 0 ? (apiCallsSaved / totalApiCallsPossible) : 0;

      console.log('SmartDataFetcherService: Optimized fetch completed', {
        totalTransactions: allTransactions.length,
        zohoSource: zohoResult.dataSource,
        stripeSource: stripeResult.dataSource,
        cacheEfficiency: Math.round(cacheEfficiency * 100) + '%',
        apiCallsSaved,
        optimizationApplied: true
      });

      // Execute callbacks
      if (callbacks?.onTransactions) {
        callbacks.onTransactions(allTransactions);
      }

      if (callbacks?.onCollaboratorData) {
        const collaboratorData = zohoRepository.getCollaboratorExpenses();
        callbacks.onCollaboratorData(collaboratorData);
      }

      if (callbacks?.onIncomeTypes) {
        const stripeData = stripeRepository.getLastRawResponse();
        callbacks.onIncomeTypes(allTransactions, stripeData);
      }

      // Step 5: Schedule predictive caching for next likely requests
      this.schedulePredictiveCaching(dateRange);

      return {
        success: true,
        zohoResult,
        stripeResult,
        totalTransactions: allTransactions.length,
        cacheEfficiency,
        apiCallsSaved,
        queryPlans: {
          zoho: zohoQueryPlan,
          stripe: stripeQueryPlan
        },
        optimizationApplied: true
      };

    } catch (error) {
      console.error('SmartDataFetcherService: Error in optimized fetch:', error);
      
      return {
        success: false,
        zohoResult: {
          transactions: [],
          dataSource: 'api',
          cacheHitRatio: 0,
          freshness: 'fresh',
          apiCallsMade: 0
        },
        stripeResult: {
          transactions: [],
          dataSource: 'api',
          cacheHitRatio: 0,
          freshness: 'fresh',
          apiCallsMade: 0
        },
        totalTransactions: 0,
        cacheEfficiency: 0,
        apiCallsSaved: 0,
        queryPlans: {
          zoho: await queryOptimizerService.createQueryPlan('Zoho', dateRange.startDate, dateRange.endDate),
          stripe: await queryOptimizerService.createQueryPlan('Stripe', dateRange.startDate, dateRange.endDate)
        },
        optimizationApplied: false
      };
    }
  }

  /**
   * Execute optimized fetch based on query plan
   */
  private async executeOptimizedFetch(
    source: 'Zoho' | 'Stripe',
    dateRange: { startDate: Date; endDate: Date },
    queryPlan: QueryPlan,
    forceRefresh: boolean
  ): Promise<HybridFetchResult> {
    // If force refresh, skip optimization
    if (forceRefresh) {
      return hybridDataService.fetchTransactions(source, dateRange.startDate, dateRange.endDate, true);
    }

    // If we can use full cache, do so
    if (queryPlan.useFullCache) {
      console.log(`SmartDataFetcherService: Using full cache for ${source}`);
      return hybridDataService.fetchTransactions(source, dateRange.startDate, dateRange.endDate, false);
    }

    // If partial cache or no cache, use hybrid approach
    console.log(`SmartDataFetcherService: Using hybrid approach for ${source}`);
    return hybridDataService.fetchTransactions(source, dateRange.startDate, dateRange.endDate, false);
  }

  /**
   * Pre-warm cache if it would be beneficial
   */
  private async preWarmIfBeneficial(
    dateRange: { startDate: Date; endDate: Date },
    zohoQueryPlan: QueryPlan,
    stripeQueryPlan: QueryPlan
  ): Promise<void> {
    // Pre-warm if cache hit ratio is low but could be improved
    const shouldPreWarmZoho = zohoQueryPlan.estimatedCacheHitRatio < 0.8 && zohoQueryPlan.requiresApiCall;
    const shouldPreWarmStripe = stripeQueryPlan.estimatedCacheHitRatio < 0.8 && stripeQueryPlan.requiresApiCall;

    const preWarmTasks: Promise<void>[] = [];

    if (shouldPreWarmZoho) {
      preWarmTasks.push(
        predictiveCacheService.preWarmForRequest('Zoho', dateRange.startDate, dateRange.endDate)
      );
    }

    if (shouldPreWarmStripe) {
      preWarmTasks.push(
        predictiveCacheService.preWarmForRequest('Stripe', dateRange.startDate, dateRange.endDate)
      );
    }

    if (preWarmTasks.length > 0) {
      console.log('SmartDataFetcherService: Pre-warming cache for better performance');
      await Promise.allSettled(preWarmTasks);
    }
  }

  /**
   * Schedule predictive caching for next likely requests
   */
  private schedulePredictiveCaching(dateRange: { startDate: Date; endDate: Date }): void {
    // Schedule warming for adjacent months (don't await)
    setTimeout(() => {
      predictiveCacheService.warmCache(['Zoho', 'Stripe'], {
        currentMonth: true,
        nextMonth: true,
        previousMonth: true,
        commonRanges: false
      }).catch(error => {
        console.error('SmartDataFetcherService: Error in predictive caching:', error);
      });
    }, 5000); // 5 second delay to not interfere with current request
  }

  /**
   * Check cache status for both sources
   */
  async analyzeCacheStatus(dateRange: { startDate: Date; endDate: Date }): Promise<{
    zoho: any;
    stripe: any;
    overall: {
      fullyCached: boolean;
      recommendsApiCall: boolean;
      efficiency: number;
    };
  }> {
    const [zohoAnalysis, stripeAnalysis] = await Promise.all([
      cacheIntelligenceService.analyzeCacheStatus('Zoho', dateRange.startDate, dateRange.endDate),
      cacheIntelligenceService.analyzeCacheStatus('Stripe', dateRange.startDate, dateRange.endDate)
    ]);

    const fullyCached = zohoAnalysis.fullyCached && stripeAnalysis.fullyCached;
    const recommendsApiCall = zohoAnalysis.recommendedAction !== 'use_cache' || 
                              stripeAnalysis.recommendedAction !== 'use_cache';
    
    // Calculate overall efficiency potential
    const avgCacheRatio = (
      (zohoAnalysis.fullyCached ? 1 : zohoAnalysis.partiallyCached ? 0.5 : 0) +
      (stripeAnalysis.fullyCached ? 1 : stripeAnalysis.partiallyCached ? 0.5 : 0)
    ) / 2;

    return {
      zoho: zohoAnalysis,
      stripe: stripeAnalysis,
      overall: {
        fullyCached,
        recommendsApiCall,
        efficiency: avgCacheRatio
      }
    };
  }

  /**
   * Configure cache freshness settings
   */
  configureFreshness(config: {
    transactional?: number;
    balance?: number;
    aggregated?: number;
  }): void {
    cacheIntelligenceService.updateFreshnessConfig(config);
  }
}

export const smartDataFetcherService = SmartDataFetcherService.getInstance();
