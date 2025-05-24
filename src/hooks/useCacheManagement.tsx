
import { useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import CacheService from '@/services/cache';

/**
 * Hook to handle cache management operations
 */
export const useCacheManagement = () => {
  // Function to fix legacy cache entries with missing year/month values
  const fixLegacyCacheEntries = useCallback(async () => {
    try {
      // Only run this once per session
      if (!localStorage.getItem('cache_migration_executed')) {
        console.log("Checking for legacy cache entries to migrate...");
        const fixedCount = await CacheService.fixMissingYearMonthValues();
        
        if (fixedCount > 0) {
          console.log(`Successfully migrated ${fixedCount} legacy cache entries`);
        }
        
        localStorage.setItem('cache_migration_executed', 'true');
      }
    } catch (err) {
      console.error("Error during cache migration:", err);
    }
  }, []);

  // Cleanup and fix cache entries with missing year/month
  const cleanupCache = useCallback(async () => {
    try {
      toast({
        title: "Limpiando caché",
        description: "Reparando entradas de caché con valores faltantes"
      });
      
      const fixedCount = await CacheService.fixMissingYearMonthValues();
      
      if (fixedCount > 0) {
        toast({
          title: "Caché reparado",
          description: `Se arreglaron ${fixedCount} entradas de caché`
        });
      } else {
        toast({
          title: "Caché en buen estado",
          description: "No se encontraron problemas en el caché"
        });
      }
      
      return fixedCount;
    } catch (err) {
      console.error("Error cleaning up cache:", err);
      
      toast({
        title: "Error al limpiar caché",
        description: "No se pudieron reparar las entradas de caché",
        variant: "destructive"
      });
      
      return 0;
    }
  }, []);

  return {
    fixLegacyCacheEntries,
    cleanupCache
  };
};
