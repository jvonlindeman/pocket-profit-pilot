
import { hybridDataService, HybridFetchResult } from './hybridDataService';
import { Transaction } from '@/types/financial';
import { stripeRepository } from '@/repositories/stripeRepository';
import { zohoRepository } from '@/repositories/zohoRepository';
import { cacheIntelligenceService } from './cacheIntelligence';

export interface SmartFetchResult {
  success: boolean;
  zohoResult: HybridFetchResult;
  stripeResult: HybridFetchResult;
  totalTransactions: number;
  cacheEfficiency: number;
  apiCallsSaved: number;
}

/**
 * Smart data fetcher that prioritizes database over APIs
 */
class SmartDataFetcherService {
  private static instance: SmartDataFetcherService;

  public static getInstance(): SmartDataFetcherService {
    if (!SmartDataFetcherService.instance) {
      SmartDataFetcherService.instance = new SmartDataFetcherService();
    }
    return SmartDataFetcherService.instance;
  }

  /**
   * Fetch all financial data using intelligent cache-first strategy
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
    console.log('SmartDataFetcherService: Starting intelligent data fetch');
    
    try {
      // Fetch data from both sources using hybrid strategy
      const [zohoResult, stripeResult] = await Promise.all([
        hybridDataService.fetchTransactions('Zoho', dateRange.startDate, dateRange.endDate, forceRefresh),
        hybridDataService.fetchTransactions('Stripe', dateRange.startDate, dateRange.endDate, forceRefresh)
      ]);

      // Combine all transactions
      const allTransactions = [...zohoResult.transactions, ...stripeResult.transactions];
      
      // Calculate efficiency metrics
      const totalApiCallsPossible = 2; // Could have made 2 API calls (Zoho + Stripe)
      const actualApiCalls = zohoResult.apiCallsMade + stripeResult.apiCallsMade;
      const apiCallsSaved = totalApiCallsPossible - actualApiCalls;
      const cacheEfficiency = totalApiCallsPossible > 0 ? (apiCallsSaved / totalApiCallsPossible) : 0;

      console.log('SmartDataFetcherService: Fetch completed', {
        totalTransactions: allTransactions.length,
        zohoSource: zohoResult.dataSource,
        stripeSource: stripeResult.dataSource,
        cacheEfficiency: Math.round(cacheEfficiency * 100) + '%',
        apiCallsSaved
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
        // Get Stripe data for income processing
        const stripeData = stripeRepository.getLastRawResponse();
        callbacks.onIncomeTypes(allTransactions, stripeData);
      }

      return {
        success: true,
        zohoResult,
        stripeResult,
        totalTransactions: allTransactions.length,
        cacheEfficiency,
        apiCallsSaved
      };

    } catch (error) {
      console.error('SmartDataFetcherService: Error fetching financial data:', error);
      
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
        apiCallsSaved: 0
      };
    }
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
