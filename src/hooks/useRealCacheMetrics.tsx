
import { useState, useCallback } from 'react';
import CacheService from '@/services/cache';

export interface RealCacheMetrics {
  overallEfficiency: number;
  estimatedApiSavings: number;
  optimizationRecommendations: string[];
  zohoStatus: {
    cached: boolean;
    partial: boolean;
    cacheAge?: number;
    recommendedAction: 'use_cache' | 'refresh_partial' | 'refresh_full';
  };
  stripeStatus: {
    cached: boolean;
    partial: boolean;
    cacheAge?: number;
    recommendedAction: 'use_cache' | 'refresh_partial' | 'refresh_full';
  };
  lastCacheCheck: Date | null;
}

export const useRealCacheMetrics = (dateRange: { startDate: Date; endDate: Date }) => {
  const [metrics, setMetrics] = useState<RealCacheMetrics>({
    overallEfficiency: 0,
    estimatedApiSavings: 0,
    optimizationRecommendations: [],
    zohoStatus: {
      cached: false,
      partial: false,
      recommendedAction: 'refresh_full'
    },
    stripeStatus: {
      cached: false,
      partial: false,
      recommendedAction: 'refresh_full'
    },
    lastCacheCheck: null
  });

  const [loading, setLoading] = useState(false);

  const analyzeCache = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    
    setLoading(true);
    try {
      console.log("🔍 useRealCacheMetrics: EXPLICIT cache analysis for:", {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        caller: new Error().stack?.split('\n')[2]?.trim()
      });

      // Check real cache status for both sources
      const [zohoCache, stripeCache] = await Promise.all([
        CacheService.checkCache('Zoho', dateRange.startDate, dateRange.endDate),
        CacheService.checkCache('Stripe', dateRange.startDate, dateRange.endDate)
      ]);

      console.log("📊 useRealCacheMetrics: Cache check results:", {
        zoho: {
          cached: zohoCache.cached,
          partial: zohoCache.partial,
          dataLength: zohoCache.data?.length || 0
        },
        stripe: {
          cached: stripeCache.cached,
          partial: stripeCache.partial,
          dataLength: stripeCache.data?.length || 0
        }
      });

      // Calculate efficiency
      const totalSources = 2;
      let cacheHits = 0;
      if (zohoCache.cached) cacheHits++;
      if (stripeCache.cached) cacheHits++;
      
      const efficiency = cacheHits / totalSources;
      const apiCallsSaved = cacheHits;

      // Determine recommendations
      const recommendations: string[] = [];
      if (efficiency < 0.5) {
        recommendations.push("Considerar precalentamiento de caché para mejorar rendimiento");
      }
      if (zohoCache.partial || stripeCache.partial) {
        recommendations.push("Datos parciales detectados - actualización incremental disponible");
      }
      if (efficiency === 1) {
        recommendations.push("Excelente: Todos los datos están siendo servidos desde caché");
      }

      // Determine recommended actions
      const getRecommendedAction = (cacheResult: typeof zohoCache) => {
        if (cacheResult.cached && !cacheResult.partial) {
          return 'use_cache' as const;
        } else if (cacheResult.cached && cacheResult.partial) {
          return 'refresh_partial' as const;
        } else {
          return 'refresh_full' as const;
        }
      };

      const newMetrics: RealCacheMetrics = {
        overallEfficiency: efficiency,
        estimatedApiSavings: apiCallsSaved,
        optimizationRecommendations: recommendations,
        zohoStatus: {
          cached: zohoCache.cached,
          partial: zohoCache.partial,
          recommendedAction: getRecommendedAction(zohoCache)
        },
        stripeStatus: {
          cached: stripeCache.cached,
          partial: stripeCache.partial,
          recommendedAction: getRecommendedAction(stripeCache)
        },
        lastCacheCheck: new Date()
      };

      console.log("✅ useRealCacheMetrics: Final metrics:", newMetrics);
      setMetrics(newMetrics);

    } catch (error) {
      console.error("❌ useRealCacheMetrics: Error analyzing cache:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // REMOVED: Auto-analyze when date range changes
  // useEffect(() => {
  //   analyzeCache();
  // }, [analyzeCache]);

  return {
    metrics,
    loading,
    refresh: analyzeCache
  };
};
