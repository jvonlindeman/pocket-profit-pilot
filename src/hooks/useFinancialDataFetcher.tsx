
import { useState, useCallback, useEffect } from 'react';
import { financialService } from '@/services/financialService';
import { zohoRepository } from '@/repositories/zohoRepository';
import { useCacheSegments } from '@/hooks/cache/useCacheSegments';
import CacheService from '@/services/cache';

/**
 * Base hook for fetching financial data
 */
export const useFinancialDataFetcher = () => {
  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [usingCachedData, setUsingCachedData] = useState<boolean>(false);
  const [cacheStatus, setCacheStatus] = useState<{
    zoho: { hit: boolean, partial: boolean },
    stripe: { hit: boolean, partial: boolean }
  }>({
    zoho: { hit: false, partial: false },
    stripe: { hit: false, partial: false }
  });
  const [apiConnectivity, setApiConnectivity] = useState<{
    zoho: boolean,
    stripe: boolean
  }>({
    zoho: true,
    stripe: true
  });

  // Get cache segments helper
  const { checkSourceCache } = useCacheSegments();

  // Check cache status
  const checkCacheStatus = useCallback(async (
    dateRange: { startDate: Date; endDate: Date }
  ) => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    try {
      // Check Zoho cache
      const zohoCache = await checkSourceCache('Zoho', dateRange);
      
      // Check Stripe cache
      const stripeCache = await checkSourceCache('Stripe', dateRange);
      
      // Update cache status
      setCacheStatus({
        zoho: { 
          hit: zohoCache.cached, 
          partial: zohoCache.partial || false 
        },
        stripe: { 
          hit: stripeCache.cached, 
          partial: stripeCache.partial || false 
        }
      });
      
      // Determine if we're using cached data
      setUsingCachedData(zohoCache.cached || stripeCache.cached);
      
      return {
        zoho: zohoCache,
        stripe: stripeCache
      };
    } catch (err) {
      console.error("Error checking cache status:", err);
      return null;
    }
  }, [checkSourceCache]);

  // Check API connectivity
  const checkApiConnectivity = useCallback(async () => {
    const result = await financialService.checkApiConnectivity();
    setApiConnectivity(result);
    return result;
  }, []);

  // Fetch financial data from external services
  const fetchFinancialData = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: {
      onTransactions: (transactions: any[]) => void,
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void,
    }
  ) => {
    setLoading(true);
    setError(null);
    
    // Check cache status first
    await checkCacheStatus(dateRange);
    
    try {
      // Check connectivity first
      await checkApiConnectivity();
      
      // Fetch the financial data
      const success = await financialService.fetchFinancialData(
        dateRange, 
        forceRefresh, 
        callbacks
      );
      
      // Get raw response for debugging
      const rawData = financialService.getLastRawResponse();
      if (rawData) {
        setRawResponse(rawData);
      }
      
      // Check cache status again after fetch to update the UI
      await checkCacheStatus(dateRange);
      
      setLoading(false);
      return success;
    } catch (err: any) {
      console.error("Error in fetchFinancialData:", err);
      setError(err.message || "Error al cargar los datos financieros");
      setLoading(false);
      return false;
    }
  }, [checkApiConnectivity, checkCacheStatus]);

  // Check cache status on mount
  useEffect(() => {
    // This will run once on mount
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    checkCacheStatus({ startDate, endDate });
  }, [checkCacheStatus]);

  return {
    loading,
    error,
    rawResponse,
    usingCachedData,
    fetchFinancialData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity,
    checkCacheStatus
  };
};
