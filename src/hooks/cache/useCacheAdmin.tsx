
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import CacheService, { DetailedCacheStats, CacheClearOptions } from '@/services/cache';

/**
 * Hook for cache administration functionality
 */
export const useCacheAdmin = () => {
  const [cacheStats, setCacheStats] = useState<DetailedCacheStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);

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
   * Verify and repair cache integrity
   */
  const verifyCacheIntegrity = useCallback(async (
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    try {
      const result = await CacheService.verifyCacheIntegrity(source, startDate, endDate);
      
      if (!result.isConsistent) {
        toast({
          title: "Cache Inconsistency Detected",
          description: `Found ${result.segmentCount} segments but ${result.transactionCount} transactions`,
          variant: "destructive"  // Changed from "warning" to "destructive" as warning is not a valid variant
        });
        
        // Try to repair
        const repaired = await CacheService.repairCacheSegments(source, startDate, endDate);
        
        if (repaired) {
          toast({
            title: "Cache Repaired",
            description: "Cache segments have been repaired successfully",
            variant: "default"
          });
          return true;
        } else {
          toast({
            title: "Cache Repair Failed",
            description: "Unable to repair cache segments automatically",
            variant: "destructive"
          });
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error verifying cache integrity:", error);
      return false;
    }
  }, []);

  return {
    cacheStats,
    isLoadingStats,
    isClearingCache,
    loadCacheStats,
    clearCache,
    verifyCacheIntegrity
  };
};
