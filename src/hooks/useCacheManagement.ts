
import { useState, useCallback, useRef } from 'react';
import { DateRange, CacheStats } from '@/types/financial';
import { CacheStatus, CacheControl } from '@/types/cache';
import { useToast } from '@/hooks/use-toast';
import ZohoService from '@/services/zohoService';

// Global cache control to prevent too frequent refreshes across component re-renders
const globalCacheControl: CacheControl = {
  maxRefreshesPerSession: 3,
  minRefreshInterval: 10000, // 10 seconds minimum between refreshes
  refreshCount: 0,
  lastRefreshTime: 0
};

export const useCacheManagement = () => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    usingCachedData: false,
    partialRefresh: false,
    stats: null,
    lastRefresh: null,
    refreshAttempts: 0
  });
  
  // Add a ref to track if a refresh is in progress
  const refreshInProgressRef = useRef<boolean>(false);
  
  const { toast } = useToast();

  /**
   * Update the cache status information
   * @param statusData Cache status data received from API
   */
  const updateCacheStatus = useCallback((statusData: any) => {
    if (statusData) {
      const now = new Date();
      setCacheStatus(prevStatus => ({
        usingCachedData: statusData.using_cached_data || statusData.usingCachedData || false,
        partialRefresh: statusData.partial_refresh || statusData.partialRefresh || false,
        stats: statusData.stats ? {
          cachedCount: statusData.stats.cached_count || statusData.stats.cachedCount || 0,
          newCount: statusData.stats.new_count || statusData.stats.newCount || 0,
          totalCount: statusData.stats.total_count || statusData.stats.totalCount || 0,
          isFresh: statusData.stats.isFresh,
          fullCoverage: statusData.stats.fullCoverage,
          partialRefreshAttempted: statusData.stats.partialRefreshAttempted,
          partialRefreshSuccess: statusData.stats.partialRefreshSuccess,
          cachedDateRange: statusData.stats.cachedDateRange
        } : prevStatus.stats,
        lastRefresh: now,
        refreshAttempts: (prevStatus.refreshAttempts || 0) + 1,
        lastRefreshAttempt: now
      }));
      
      console.log("🔄 Cache status updated:", {
        usingCachedData: statusData.using_cached_data || statusData.usingCachedData || false,
        partialRefresh: statusData.partial_refresh || statusData.partialRefresh || false,
        stats: statusData.stats,
        time: now.toISOString()
      });
    }
  }, []);

  /**
   * Check if a refresh operation can proceed based on global limits
   */
  const canRefresh = useCallback((): { allowed: boolean; reason?: string } => {
    // Check if refresh is already in progress
    if (refreshInProgressRef.current) {
      return { allowed: false, reason: 'Refresh already in progress' };
    }
    
    // Check if we've hit the maximum number of refreshes
    if (globalCacheControl.refreshCount >= globalCacheControl.maxRefreshesPerSession) {
      return { allowed: false, reason: 'Maximum refresh limit reached' };
    }
    
    // Check if it's too soon for another refresh
    const now = Date.now();
    const timeSinceLastRefresh = now - globalCacheControl.lastRefreshTime;
    
    if (globalCacheControl.lastRefreshTime > 0 && 
        timeSinceLastRefresh < globalCacheControl.minRefreshInterval) {
      return { 
        allowed: false, 
        reason: `Too soon since last refresh (${Math.round(timeSinceLastRefresh / 1000)}s ago)` 
      };
    }
    
    return { allowed: true };
  }, []);

  /**
   * Clear cache and force refresh data
   * @param dateRange Date range for which to clear cache
   */
  const clearCacheForDateRange = useCallback(async (dateRange: DateRange) => {
    try {
      console.log('🗑️ Clearing cache for date range:', dateRange);
      
      // Check if we can perform a refresh
      const refreshCheck = canRefresh();
      if (!refreshCheck.allowed) {
        console.log(`❌ Cache refresh prevented: ${refreshCheck.reason}`);
        toast({
          title: "Refresh not allowed",
          description: refreshCheck.reason,
          variant: "destructive"
        });
        return false;
      }
      
      // Notify user
      toast({
        title: "Limpiando caché",
        description: "Eliminando datos en caché y obteniendo datos frescos...",
      });
      
      // Mark refresh in progress
      refreshInProgressRef.current = true;
      
      // Track refresh count and time
      globalCacheControl.refreshCount++;
      globalCacheControl.lastRefreshTime = Date.now();
      
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
    } finally {
      // Mark refresh completed
      refreshInProgressRef.current = false;
    }
  }, [toast, canRefresh]);

  return {
    cacheStatus,
    updateCacheStatus,
    clearCacheForDateRange,
    canRefresh,
    refreshInProgress: refreshInProgressRef.current
  };
};
