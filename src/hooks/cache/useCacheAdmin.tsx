
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import CacheService, { DetailedCacheStats, CacheClearOptions, CacheSource } from '@/services/cache';

/**
 * Hook for cache administration functionality
 */
export const useCacheAdmin = () => {
  const [cacheStats, setCacheStats] = useState<DetailedCacheStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  
  // Load stats on mount
  useEffect(() => {
    loadCacheStats();
  }, []);

  /**
   * Load detailed cache statistics
   */
  const loadCacheStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const stats = await CacheService.getDetailedStats();
      setCacheStats(stats);
      return stats;
    } catch (error) {
      console.error("Error loading cache stats:", error);
      toast({
        title: "Error",
        description: "Failed to load cache statistics",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  /**
   * Clear cache with the specified options
   */
  const clearCache = useCallback(async (options?: CacheClearOptions): Promise<boolean> => {
    setIsClearingCache(true);
    try {
      const result = await CacheService.clearCache(options);
      
      if (result) {
        toast({
          title: "Cache Cleared",
          description: "The selected cache data has been successfully cleared",
          variant: "default"
        });
        
        // Refresh cache stats
        await loadCacheStats();
        return true;
      } else {
        toast({
          title: "Failed to Clear Cache",
          description: "There was an error clearing the cache data",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while clearing the cache",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsClearingCache(false);
    }
  }, [loadCacheStats]);

  /**
   * Refresh cache for a source and date range
   */
  const refreshCache = useCallback(async (
    source: CacheSource,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    try {
      setIsLoadingStats(true);
      const result = await CacheService.refreshCache(source, startDate, endDate);
      
      if (result) {
        toast({
          title: "Cache Refreshed",
          description: `Successfully refreshed ${source} cache data`,
          variant: "default"
        });
        
        // Reload stats after refresh
        await loadCacheStats();
        return true;
      } else {
        toast({
          title: "Cache Refresh Failed",
          description: `Unable to refresh ${source} cache data`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error refreshing cache:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while refreshing the cache",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoadingStats(false);
    }
  }, [loadCacheStats]);

  /**
   * Verify and repair cache integrity
   */
  const verifyCacheIntegrity = useCallback(async (
    source: CacheSource | 'all',
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    try {
      // If source is 'all', verify both Zoho and Stripe
      if (source === 'all') {
        const zohoResult = await CacheService.verifyCacheIntegrity('Zoho', startDate, endDate);
        const stripeResult = await CacheService.verifyCacheIntegrity('Stripe', startDate, endDate);
        
        const hasIssues = !zohoResult.isConsistent || !stripeResult.isConsistent;
        
        if (hasIssues) {
          toast({
            title: "Cache Inconsistency Detected",
            description: "Issues found in cache data. Attempting repair...",
            variant: "destructive"
          });
          
          // Repair both sources
          const zohoRepaired = !zohoResult.isConsistent ? 
            await CacheService.repairCacheSegments('Zoho', startDate, endDate) : true;
          const stripeRepaired = !stripeResult.isConsistent ? 
            await CacheService.repairCacheSegments('Stripe', startDate, endDate) : true;
          
          if (zohoRepaired && stripeRepaired) {
            toast({
              title: "Cache Repaired",
              description: "Cache segments have been repaired successfully",
              variant: "default"
            });
            await loadCacheStats();
            return true;
          } else {
            toast({
              title: "Cache Repair Failed",
              description: "Unable to repair some cache segments automatically",
              variant: "destructive"
            });
            return false;
          }
        } else {
          toast({
            title: "Cache Integrity Verified",
            description: "All cache segments are consistent",
            variant: "default"
          });
          return true;
        }
      } else {
        // Verify single source
        const result = await CacheService.verifyCacheIntegrity(source, startDate, endDate);
        
        if (!result.isConsistent) {
          toast({
            title: "Cache Inconsistency Detected",
            description: `Found ${result.segmentCount} segments but ${result.transactionCount} transactions`,
            variant: "destructive"
          });
          
          // Try to repair
          const repaired = await CacheService.repairCacheSegments(source, startDate, endDate);
          
          if (repaired) {
            toast({
              title: "Cache Repaired",
              description: "Cache segments have been repaired successfully",
              variant: "default"
            });
            await loadCacheStats();
            return true;
          } else {
            toast({
              title: "Cache Repair Failed",
              description: "Unable to repair cache segments automatically",
              variant: "destructive"
            });
            return false;
          }
        } else {
          toast({
            title: "Cache Integrity Verified",
            description: `Found ${result.segmentCount} segments with ${result.transactionCount} transactions`,
            variant: "default"
          });
          return true;
        }
      }
    } catch (error) {
      console.error("Error verifying cache integrity:", error);
      toast({
        title: "Error",
        description: "Failed to verify cache integrity",
        variant: "destructive"
      });
      return false;
    }
  }, [loadCacheStats]);

  return {
    cacheStats,
    isLoadingStats,
    isClearingCache,
    loadCacheStats,
    clearCache,
    refreshCache,
    verifyCacheIntegrity
  };
};
