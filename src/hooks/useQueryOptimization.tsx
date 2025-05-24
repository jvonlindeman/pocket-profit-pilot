
import { useState, useCallback, useEffect } from 'react';
import { queryOptimizerService, QueryPlan, DataFreshnessConfig } from '@/services/queryOptimizer';
import { predictiveCacheService } from '@/services/predictiveCacheService';
import { CacheSource } from '@/services/cache/types';

export interface QueryOptimizationState {
  isOptimizing: boolean;
  queryPlans: {
    zoho?: QueryPlan;
    stripe?: QueryPlan;
  };
  optimizationEnabled: boolean;
  freshnessConfig: DataFreshnessConfig;
  warmingStatus: {
    inProgress: string[];
    lastWarmingTimes: Record<string, Date>;
  };
}

/**
 * Hook for managing query optimization and predictive caching
 */
export const useQueryOptimization = () => {
  const [state, setState] = useState<QueryOptimizationState>({
    isOptimizing: false,
    queryPlans: {},
    optimizationEnabled: true,
    freshnessConfig: queryOptimizerService.getFreshnessConfig(),
    warmingStatus: {
      inProgress: [],
      lastWarmingTimes: {}
    }
  });

  /**
   * Analyze query plans for a date range
   */
  const analyzeQueryPlans = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    sources: CacheSource[] = ['Zoho', 'Stripe']
  ) => {
    setState(prev => ({ ...prev, isOptimizing: true }));

    try {
      const plans: { [key: string]: QueryPlan } = {};
      
      for (const source of sources) {
        plans[source.toLowerCase()] = await queryOptimizerService.createQueryPlan(
          source,
          dateRange.startDate,
          dateRange.endDate
        );
      }

      setState(prev => ({
        ...prev,
        queryPlans: plans,
        isOptimizing: false
      }));

      return plans;
    } catch (error) {
      console.error('Error analyzing query plans:', error);
      setState(prev => ({ ...prev, isOptimizing: false }));
      return {};
    }
  }, []);

  /**
   * Optimize date range for better cache alignment
   */
  const optimizeDateRange = useCallback((
    startDate: Date,
    endDate: Date
  ) => {
    return queryOptimizerService.optimizeDateRangeForCache(startDate, endDate);
  }, []);

  /**
   * Update freshness configuration
   */
  const updateFreshnessConfig = useCallback((
    config: Partial<DataFreshnessConfig>
  ) => {
    queryOptimizerService.updateFreshnessConfig(config);
    setState(prev => ({
      ...prev,
      freshnessConfig: queryOptimizerService.getFreshnessConfig()
    }));
  }, []);

  /**
   * Toggle query optimization
   */
  const toggleOptimization = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, optimizationEnabled: enabled }));
  }, []);

  /**
   * Warm cache manually
   */
  const warmCache = useCallback(async (
    sources: CacheSource[] = ['Zoho', 'Stripe'],
    strategy = {
      currentMonth: true,
      nextMonth: false,
      previousMonth: true,
      commonRanges: true
    }
  ) => {
    await predictiveCacheService.warmCache(sources, strategy);
    updateWarmingStatus();
  }, []);

  /**
   * Update warming status
   */
  const updateWarmingStatus = useCallback(() => {
    const status = predictiveCacheService.getWarmingStatus();
    setState(prev => ({ ...prev, warmingStatus: status }));
  }, []);

  /**
   * Clear warming state
   */
  const clearWarmingState = useCallback(() => {
    predictiveCacheService.clearWarmingState();
    updateWarmingStatus();
  }, []);

  /**
   * Get cache efficiency metrics
   */
  const getCacheEfficiencyMetrics = useCallback(() => {
    const { queryPlans } = state;
    
    if (!queryPlans.zoho || !queryPlans.stripe) {
      return {
        overallEfficiency: 0,
        estimatedApiSavings: 0,
        optimizationRecommendations: []
      };
    }

    const avgCacheHitRatio = (queryPlans.zoho.estimatedCacheHitRatio + queryPlans.stripe.estimatedCacheHitRatio) / 2;
    const apiCallsNeeded = (queryPlans.zoho.requiresApiCall ? 1 : 0) + (queryPlans.stripe.requiresApiCall ? 1 : 0);
    const estimatedApiSavings = 2 - apiCallsNeeded;

    const recommendations: string[] = [];
    
    if (queryPlans.zoho.estimatedCacheHitRatio < 0.5) {
      recommendations.push('Consider warming Zoho cache');
    }
    
    if (queryPlans.stripe.estimatedCacheHitRatio < 0.5) {
      recommendations.push('Consider warming Stripe cache');
    }
    
    if (avgCacheHitRatio > 0.8) {
      recommendations.push('Cache performance is excellent');
    }

    return {
      overallEfficiency: avgCacheHitRatio,
      estimatedApiSavings,
      optimizationRecommendations: recommendations
    };
  }, [state.queryPlans]);

  // Update warming status periodically
  useEffect(() => {
    const interval = setInterval(updateWarmingStatus, 30000); // 30 seconds
    updateWarmingStatus();
    
    return () => clearInterval(interval);
  }, [updateWarmingStatus]);

  return {
    // State
    ...state,
    
    // Actions
    analyzeQueryPlans,
    optimizeDateRange,
    updateFreshnessConfig,
    toggleOptimization,
    warmCache,
    clearWarmingState,
    
    // Computed
    getCacheEfficiencyMetrics
  };
};
