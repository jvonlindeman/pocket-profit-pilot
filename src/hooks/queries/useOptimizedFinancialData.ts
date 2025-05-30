import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/financial';
import CacheService from '@/services/cache';
import { stripeRepository } from '@/repositories/stripeRepository';
import { zohoRepository } from '@/repositories/zohoRepository';
import { MonthlyCacheSync } from '@/services/cache/syncMonthlyCache';

interface FinancialData {
  transactions: Transaction[];
  stripeData?: any;
  loading: boolean;
  error: string | null;
  usingCachedData: boolean;
  cacheStatus: {
    zoho: { hit: boolean, partial: boolean },
    stripe: { hit: boolean, partial: boolean }
  };
  isDataRequested: boolean;
  cacheChecked: boolean;
  hasCachedData: boolean;
  isRefreshing: boolean;
  lastRefreshTime?: number;
}

export function useOptimizedFinancialData(startDate: Date, endDate: Date) {
  const [data, setData] = useState<FinancialData>({
    transactions: [],
    loading: false,
    error: null,
    usingCachedData: false,
    cacheStatus: {
      zoho: { hit: false, partial: false },
      stripe: { hit: false, partial: false }
    },
    isDataRequested: false,
    cacheChecked: false,
    hasCachedData: false,
    isRefreshing: false
  });

  // PASSIVE CACHE CHECK - Only check if cache exists, don't load data automatically
  useEffect(() => {
    let isMounted = true;

    const checkCacheExistence = async () => {
      console.log("🔍 useOptimizedFinancialData: PASSIVE cache existence check only", {
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      });

      try {
        // Run monthly cache sync in background
        console.log("🔄 useOptimizedFinancialData: Running background monthly cache sync...");
        MonthlyCacheSync.syncAllMissingEntries().catch(error => {
          console.warn("Background sync failed:", error);
        });

        // Check cache existence WITHOUT loading data
        const [zohoCacheCheck, stripeCacheCheck] = await Promise.all([
          CacheService.checkCache('Zoho', startDate, endDate),
          CacheService.checkCache('Stripe', startDate, endDate)
        ]);

        if (!isMounted) return;

        const hasZohoCache = zohoCacheCheck.cached && zohoCacheCheck.data && zohoCacheCheck.data.length > 0;
        const hasStripeCache = stripeCacheCheck.cached && stripeCacheCheck.data && stripeCacheCheck.data.length > 0;
        const hasCachedData = hasZohoCache || hasStripeCache;

        console.log("🔍 useOptimizedFinancialData: PASSIVE cache check results", {
          zoho: { 
            exists: hasZohoCache, 
            count: zohoCacheCheck.data?.length || 0,
            status: zohoCacheCheck.status,
            isStale: zohoCacheCheck.isStale
          },
          stripe: { 
            exists: hasStripeCache, 
            count: stripeCacheCheck.data?.length || 0,
            status: stripeCacheCheck.status,
            isStale: stripeCacheCheck.isStale
          },
          hasCachedData,
          autoLoadingPrevented: true
        });

        // ONLY update cache status - DO NOT load data automatically
        setData(prev => ({
          ...prev,
          cacheChecked: true,
          hasCachedData: hasCachedData,
          cacheStatus: {
            zoho: { hit: hasZohoCache, partial: zohoCacheCheck.partial || false },
            stripe: { hit: hasStripeCache, partial: stripeCacheCheck.partial || false }
          }
        }));

        if (hasCachedData) {
          console.log("✅ useOptimizedFinancialData: Cache exists but NOT auto-loading - waiting for user action");
        } else {
          console.log("❌ useOptimizedFinancialData: No cache found - user interaction required");
        }
      } catch (error) {
        console.error("❌ useOptimizedFinancialData: Error during passive cache check:", error);
        if (isMounted) {
          setData(prev => ({
            ...prev,
            cacheChecked: true,
            hasCachedData: false,
            error: error instanceof Error ? error.message : 'Error checking cache'
          }));
        }
      }
    };

    checkCacheExistence();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log("🚀 useOptimizedFinancialData: MANUAL fetch requested by user action", {
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      forceRefresh,
      currentDataCount: data.transactions.length,
      caller: new Error().stack?.split('\n')[2]?.trim()
    });
    
    // Smart refresh approach for force refresh
    if (forceRefresh && data.transactions.length > 0) {
      console.log("🔄 useOptimizedFinancialData: SMART REFRESH - Keeping existing data visible while refreshing");
      
      // Mark cache as stale
      CacheService.markCacheStale('Zoho', startDate, endDate);
      CacheService.markCacheStale('Stripe', startDate, endDate);
      
      // Show refreshing state but keep existing data
      setData(prev => ({ 
        ...prev, 
        isRefreshing: true,
        error: null
      }));
      
      try {
        // Fetch fresh data in background
        let allTransactions: Transaction[] = [];
        let stripeData: any = null;
        
        console.log("🌐 useOptimizedFinancialData: Fetching fresh data from APIs during smart refresh...");
        
        // Fetch Stripe data
        stripeData = await stripeRepository.getTransactions(startDate, endDate, true);
        allTransactions = [...allTransactions, ...stripeData.transactions];
        console.log(`📡 useOptimizedFinancialData: SMART REFRESH - Fetched ${stripeData.transactions.length} fresh Stripe transactions`);
        
        // Fetch Zoho data
        const zohoTransactions = await zohoRepository.getTransactions(startDate, endDate, true);
        allTransactions = [...allTransactions, ...zohoTransactions];
        console.log(`📡 useOptimizedFinancialData: SMART REFRESH - Fetched ${zohoTransactions.length} fresh Zoho transactions`);
        
        console.log("📊 useOptimizedFinancialData: SMART REFRESH COMPLETED", {
          totalTransactions: allTransactions.length,
          previousCount: data.transactions.length,
          dataUpdated: allTransactions.length !== data.transactions.length,
          refreshTime: new Date().toISOString()
        });
        
        // Update with fresh data
        setData(prev => ({
          ...prev,
          transactions: allTransactions,
          stripeData,
          isRefreshing: false,
          error: null,
          usingCachedData: false,
          cacheStatus: {
            zoho: { hit: false, partial: false },
            stripe: { hit: false, partial: false }
          },
          lastRefreshTime: Date.now()
        }));
        
        return;
      } catch (error) {
        console.error("❌ useOptimizedFinancialData: Error during smart refresh:", error);
        
        // Keep existing data on error, just stop refreshing indicator
        setData(prev => ({
          ...prev,
          isRefreshing: false,
          error: error instanceof Error ? error.message : 'Error refreshing data'
        }));
        return;
      }
    }
    
    // Standard loading for initial load or when no existing data
    setData(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      isDataRequested: true
    }));

    try {
      let allTransactions: Transaction[] = [];
      let stripeData: any = null;
      let usingCache = false;
      const cacheStatus = {
        zoho: { hit: false, partial: false },
        stripe: { hit: false, partial: false }
      };

      // CACHE-FIRST STRATEGY: Only bypass cache if explicitly force refreshing
      if (!forceRefresh) {
        console.log("🔍 useOptimizedFinancialData: Using CACHE-FIRST strategy for manual load");
        
        // Check Stripe cache first
        const stripeCacheCheck = await CacheService.checkCache('Stripe', startDate, endDate);
        
        if (stripeCacheCheck.cached && stripeCacheCheck.data && stripeCacheCheck.data.length > 0) {
          console.log(`✅ useOptimizedFinancialData: CACHE HIT - Loading cached Stripe data (${stripeCacheCheck.data.length} transactions)`);
          
          const transactions = stripeCacheCheck.data;
          const gross = transactions.reduce((sum, tx) => sum + (tx.gross || tx.amount), 0);
          const fees = transactions.reduce((sum, tx) => sum + (tx.fees || 0), 0);
          const net = gross - fees;
          const feePercentage = gross > 0 ? (fees / gross) * 100 : 0;
          
          stripeData = {
            transactions,
            gross,
            fees,
            transactionFees: fees,
            payoutFees: 0,
            additionalFees: 0,
            net,
            feePercentage
          };
          
          allTransactions = [...allTransactions, ...transactions];
          usingCache = true;
          cacheStatus.stripe = { hit: true, partial: stripeCacheCheck.partial };
        }

        // Check Zoho cache
        const zohoCacheCheck = await CacheService.checkCache('Zoho', startDate, endDate);
        
        if (zohoCacheCheck.cached && zohoCacheCheck.data && zohoCacheCheck.data.length > 0) {
          console.log(`✅ useOptimizedFinancialData: CACHE HIT - Loading cached Zoho data (${zohoCacheCheck.data.length} transactions)`);
          allTransactions = [...allTransactions, ...zohoCacheCheck.data];
          usingCache = true;
          cacheStatus.zoho = { hit: true, partial: zohoCacheCheck.partial };
        }
      }

      // Only fetch from API if we don't have cached data OR if force refresh is requested
      if (allTransactions.length === 0 || forceRefresh) {
        console.log("🌐 useOptimizedFinancialData: Fetching from API", { 
          reason: forceRefresh ? 'force_refresh' : 'no_cache_data' 
        });

        // Reset if force refresh
        if (forceRefresh) {
          allTransactions = [];
          stripeData = null;
          usingCache = false;
        }

        // Fetch Stripe data if not cached or force refresh
        if (!stripeData || forceRefresh) {
          console.log("🌐 useOptimizedFinancialData: Fetching Stripe data from API...");
          stripeData = await stripeRepository.getTransactions(startDate, endDate, forceRefresh);
          allTransactions = [...allTransactions, ...stripeData.transactions];
          cacheStatus.stripe = { hit: false, partial: false };
          console.log(`📡 useOptimizedFinancialData: API CALL - Fetched ${stripeData.transactions.length} Stripe transactions`);
        }

        // Fetch Zoho data if not cached or force refresh
        if (!cacheStatus.zoho.hit || forceRefresh) {
          console.log("🌐 useOptimizedFinancialData: Fetching Zoho data from API...");
          const zohoTransactions = await zohoRepository.getTransactions(startDate, endDate, forceRefresh);
          allTransactions = [...allTransactions, ...zohoTransactions];
          cacheStatus.zoho = { hit: false, partial: false };
          console.log(`📡 useOptimizedFinancialData: API CALL - Fetched ${zohoTransactions.length} Zoho transactions`);
        }
      }

      // Final summary
      const totalCacheHits = (cacheStatus.zoho.hit ? 1 : 0) + (cacheStatus.stripe.hit ? 1 : 0);
      const totalSources = 2;
      const cacheEfficiency = (totalCacheHits / totalSources) * 100;
      
      console.log("📊 useOptimizedFinancialData: MANUAL LOAD SUMMARY", {
        totalTransactions: allTransactions.length,
        zohoSource: cacheStatus.zoho.hit ? 'CACHE' : 'API',
        stripeSource: cacheStatus.stripe.hit ? 'CACHE' : 'API',
        cacheEfficiency: `${cacheEfficiency.toFixed(1)}%`,
        usingCachedData: usingCache,
        apiCallsMade: totalSources - totalCacheHits,
        strategy: forceRefresh ? 'FORCE_REFRESH' : 'CACHE_FIRST',
        userAction: true
      });

      setData({
        transactions: allTransactions,
        stripeData,
        loading: false,
        error: null,
        usingCachedData: usingCache,
        cacheStatus,
        isDataRequested: true,
        cacheChecked: true,
        hasCachedData: allTransactions.length > 0,
        isRefreshing: false,
        lastRefreshTime: Date.now()
      });

    } catch (error) {
      console.error("❌ useOptimizedFinancialData: Error during manual fetch:", error);
      
      // Fallback to cached data if API fails
      console.log("🔄 useOptimizedFinancialData: API failed, attempting cache fallback");
      try {
        const [zohoCacheCheck, stripeCacheCheck] = await Promise.all([
          CacheService.checkCache('Zoho', startDate, endDate),
          CacheService.checkCache('Stripe', startDate, endDate)
        ]);
        
        let fallbackTransactions: Transaction[] = [];
        let fallbackStripeData: any = null;
        
        if (stripeCacheCheck.cached && stripeCacheCheck.data) {
          const transactions = stripeCacheCheck.data;
          fallbackTransactions = [...fallbackTransactions, ...transactions];
          
          const gross = transactions.reduce((sum, tx) => sum + (tx.gross || tx.amount), 0);
          const fees = transactions.reduce((sum, tx) => sum + (tx.fees || 0), 0);
          
          fallbackStripeData = {
            transactions,
            gross,
            fees,
            transactionFees: fees,
            payoutFees: 0,
            additionalFees: 0,
            net: gross - fees,
            feePercentage: gross > 0 ? (fees / gross) * 100 : 0
          };
        }
        
        if (zohoCacheCheck.cached && zohoCacheCheck.data) {
          fallbackTransactions = [...fallbackTransactions, ...zohoCacheCheck.data];
        }
        
        if (fallbackTransactions.length > 0) {
          console.log("✅ useOptimizedFinancialData: Using cached data as fallback after API error");
          setData(prev => ({
            ...prev,
            transactions: fallbackTransactions,
            stripeData: fallbackStripeData,
            loading: false,
            isRefreshing: false,
            error: null,
            usingCachedData: true,
            cacheStatus: {
              zoho: { hit: zohoCacheCheck.cached, partial: zohoCacheCheck.partial },
              stripe: { hit: stripeCacheCheck.cached, partial: stripeCacheCheck.partial }
            },
            hasCachedData: true
          }));
          return;
        }
      } catch (fallbackError) {
        console.error("❌ useOptimizedFinancialData: Cache fallback also failed:", fallbackError);
      }
      
      setData(prev => ({
        ...prev,
        loading: false,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isDataRequested: true,
        cacheChecked: true
      }));
    }
  }, [startDate, endDate, data.transactions.length]);

  console.log("🔄 useOptimizedFinancialData: Hook rendered - PASSIVE MODE", {
    dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    hasData: data.transactions.length > 0,
    isDataRequested: data.isDataRequested,
    cacheChecked: data.cacheChecked,
    hasCachedData: data.hasCachedData,
    loading: data.loading,
    isRefreshing: data.isRefreshing,
    usingCachedData: data.usingCachedData,
    autoLoadingDisabled: true
  });

  const refetch = useCallback((forceRefresh = false) => {
    console.log("🔄 useOptimizedFinancialData: Manual refetch requested by user", { 
      forceRefresh,
      reason: forceRefresh ? 'user_force_refresh' : 'user_refresh',
      caller: new Error().stack?.split('\n')[2]?.trim()
    });
    return fetchData(forceRefresh);
  }, [fetchData]);

  return {
    ...data,
    refetch
  };
}
