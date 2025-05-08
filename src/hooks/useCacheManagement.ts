
import { useState, useCallback } from 'react';
import { DateRange, CacheStats } from '@/types/financial';
import { CacheStatus } from '@/types/cache';
import { useToast } from '@/hooks/use-toast';
import ZohoService from '@/services/zohoService';

export const useCacheManagement = () => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    usingCachedData: false,
    partialRefresh: false,
    stats: null,
    lastRefresh: null
  });
  
  const { toast } = useToast();

  /**
   * Update the cache status information
   * @param statusData Cache status data received from API
   */
  const updateCacheStatus = useCallback((statusData: any) => {
    if (statusData) {
      setCacheStatus({
        usingCachedData: statusData.using_cached_data || false,
        partialRefresh: statusData.partial_refresh || false,
        stats: statusData.stats ? {
          cachedCount: statusData.stats.cached_count || 0,
          newCount: statusData.stats.new_count || 0,
          totalCount: statusData.stats.total_count || 0
        } : null,
        lastRefresh: new Date()
      });
      
      console.log("🔄 Cache status updated:", {
        usingCachedData: statusData.using_cached_data || false,
        partialRefresh: statusData.partial_refresh || false,
        stats: statusData.stats
      });
    }
  }, []);

  /**
   * Clear cache and force refresh data
   * @param dateRange Date range for which to clear cache
   */
  const clearCacheForDateRange = useCallback(async (dateRange: DateRange) => {
    try {
      console.log('🗑️ Clearing cache for date range:', dateRange);
      toast({
        title: "Limpiando caché",
        description: "Eliminando datos en caché y obteniendo datos frescos...",
      });
      
      const success = await ZohoService.clearCacheForDateRange(dateRange.startDate, dateRange.endDate);
      
      if (success) {
        console.log('✅ Cache cleared successfully');
        toast({
          title: "Caché limpiado con éxito",
          description: "Se va a obtener datos frescos de la API",
        });
        return true;
      } else {
        throw new Error("No se pudo limpiar el caché");
      }
    } catch (err: any) {
      console.error("❌ Error clearing cache:", err);
      toast({
        variant: "destructive",
        title: "Error al limpiar el caché",
        description: err instanceof Error ? err.message : "Error desconocido al limpiar el caché",
      });
      return false;
    }
  }, [toast]);

  return {
    cacheStatus,
    updateCacheStatus,
    clearCacheForDateRange
  };
};
