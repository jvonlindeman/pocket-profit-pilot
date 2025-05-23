
import { useState, useCallback, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { Transaction } from '@/types/financial';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { useSearchParams } from 'react-router-dom';
import CacheService from '@/services/cache';
import StripeService from '@/services/stripeService';

/**
 * Enhanced hook to handle fetching of financial data with transaction management
 */
export const useEnhancedFinancialDataFetcher = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { 
    loading, 
    error, 
    rawResponse, 
    usingCachedData, 
    fetchFinancialData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity
  } = useFinancialDataFetcher();

  // Remove refresh parameter from URL if present
  useEffect(() => {
    if (searchParams.has('refresh')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('refresh');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check if we need to fix any legacy cache entries with missing year/month values
  useEffect(() => {
    const fixLegacyCacheEntries = async () => {
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
    };
    
    fixLegacyCacheEntries();
  }, []);

  // Function to debug Stripe transactions caching
  const debugStripeCaching = async (dateRange: { startDate: Date; endDate: Date }) => {
    try {
      const result = await StripeService.debugCacheProcess(dateRange.startDate, dateRange.endDate);
      
      console.log("Stripe Cache Debug Results:", result);
      
      toast({
        title: "Stripe Cache Debugging Complete",
        description: `Found ${result.transactionCount || 0} transactions. Check console for details.`,
        variant: result.status === 'error' ? 'destructive' : 'default'
      });
      
      return result;
    } catch (err) {
      console.error("Error debugging Stripe cache:", err);
      toast({
        title: "Stripe Cache Debug Error",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
      return { status: 'error', error: err };
    }
  };

  // Function to fetch data
  const fetchData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false,
    callbacks: {
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void
    }
  ) => {
    const success = await fetchFinancialData(
      dateRange,
      forceRefresh,
      {
        onTransactions: (combinedData) => {
          setTransactions(combinedData);
          setDataInitialized(true);
        },
        onCollaboratorData: callbacks.onCollaboratorData,
        onIncomeTypes: callbacks.onIncomeTypes
      }
    );
    
    if (success && transactions.length > 0) {
      toast({
        title: usingCachedData ? "Datos financieros cargados desde caché" : "Datos financieros actualizados",
        description: `Se procesaron ${transactions.length} transacciones${usingCachedData ? " (desde caché)" : ""}`
      });
    }
    
    return success;
  }, [
    fetchFinancialData, 
    transactions.length,
    usingCachedData
  ]);
  
  // Public function to refresh data
  const refreshData = useCallback((force = false) => {
    if (force) {
      toast({
        title: "Forzando actualización",
        description: "Obteniendo datos frescos desde la API"
      });
    }
    return fetchData; // Return the fetchData function for later use
  }, [fetchData]);

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
    transactions,
    dataInitialized,
    loading,
    error,
    rawResponse,
    usingCachedData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity,
    fetchData,
    refreshData,
    cleanupCache,
    debugStripeCaching
  };
};
