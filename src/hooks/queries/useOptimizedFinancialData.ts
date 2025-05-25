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
    hasCachedData: false
  });

  // Check cache on mount and ALWAYS load cached data if available
  useEffect(() => {
    let isMounted = true;

    const checkAndLoadCacheOnMount = async () => {
      console.log("🔍 useOptimizedFinancialData: CACHE-FIRST check on mount", {
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      });

      try {
        // First, run a one-time sync to ensure monthly_cache is up to date
        console.log("🔄 useOptimizedFinancialData: Running monthly cache sync...");
        const syncResult = await MonthlyCacheSync.syncAllMissingEntries();
        console.log("🔄 useOptimizedFinancialData: Sync completed", syncResult);

        // Check both sources for cached data - ALWAYS prioritize cache
        const [zohoCacheCheck, stripeCacheCheck] = await Promise.all([
          CacheService.checkCache('Zoho', startDate, endDate),
          CacheService.checkCache('Stripe', startDate, endDate)
        ]);

        if (!isMounted) return;

        const hasZohoCache = zohoCacheCheck.cached && zohoCacheCheck.data && zohoCacheCheck.data.length > 0;
        const hasStripeCache = stripeCacheCheck.cached && stripeCacheCheck.data && stripeCacheCheck.data.length > 0;
        const hasCachedData = hasZohoCache || hasStripeCache;

        console.log("🔍 useOptimizedFinancialData: CACHE-FIRST results", {
          zoho: { 
            cached: hasZohoCache, 
            count: zohoCacheCheck.data?.length || 0,
            status: zohoCacheCheck.status 
          },
          stripe: { 
            cached: hasStripeCache, 
            count: stripeCacheCheck.data?.length || 0,
            status: stripeCacheCheck.status 
          },
          totalCachedData: hasCachedData
        });

        if (hasCachedData) {
          console.log("✅ useOptimizedFinancialData: CACHE-FIRST loading - showing cached data immediately");
          
          let allTransactions: Transaction[] = [];
          let stripeData: any = null;

          // Load Zoho cached data
          if (hasZohoCache) {
            allTransactions = [...allTransactions, ...zohoCacheCheck.data];
            console.log(`📊 useOptimizedFinancialData: Loaded ${zohoCacheCheck.data.length} Zoho transactions from cache`);
          }

          // Load Stripe cached data
          if (hasStripeCache) {
            const transactions = stripeCacheCheck.data;
            allTransactions = [...allTransactions, ...transactions];
            
            // Calculate summary from cached data
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
            
            console.log(`📊 useOptimizedFinancialData: Loaded ${transactions.length} Stripe transactions from cache`);
          }

          setData({
            transactions: allTransactions,
            stripeData,
            loading: false,
            error: null,
            usingCachedData: true,
            cacheStatus: {
              zoho: { hit: hasZohoCache, partial: zohoCacheCheck.partial || false },
              stripe: { hit: hasStripeCache, partial: stripeCacheCheck.partial || false }
            },
            isDataRequested: true,
            cacheChecked: true,
            hasCachedData: true
          });

          console.log("🎉 useOptimizedFinancialData: CACHE-FIRST success - user sees data immediately", {
            totalTransactions: allTransactions.length,
            sources: {
              zoho: hasZohoCache ? 'CACHE' : 'NONE',
              stripe: hasStripeCache ? 'CACHE' : 'NONE'
            }
          });
        } else {
          console.log("❌ useOptimizedFinancialData: No cached data found, user interaction required");
          setData(prev => ({
            ...prev,
            cacheChecked: true,
            hasCachedData: false
          }));
        }
      } catch (error) {
        console.error("❌ useOptimizedFinancialData: Error during cache check:", error);
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

    checkAndLoadCacheOnMount();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log("🚀 useOptimizedFinancialData: EXPLICIT fetch requested", {
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      forceRefresh,
      currentDataCount: data.transactions.length,
      caller: new Error().stack?.split('\n')[2]?.trim()
    });
    
    // If we already have cached data and this is not a force refresh, don't clear the UI
    const hasExistingData = data.transactions.length > 0;
    
    setData(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      isDataRequested: true,
      // Keep existing transactions visible while loading if not force refresh
      ...(hasExistingData && !forceRefresh ? {} : { transactions: [] })
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
        console.log("🔍 useOptimizedFinancialData: Using CACHE-FIRST strategy");
        
        // Check Stripe cache first
        const stripeCacheCheck = await CacheService.checkCache('Stripe', startDate, endDate);
        
        if (stripeCacheCheck.cached && stripeCacheCheck.data && stripeCacheCheck.data.length > 0) {
          console.log(`✅ useOptimizedFinancialData: CACHE HIT - Using cached Stripe data (${stripeCacheCheck.data.length} transactions)`);
          
          // Calculate summary from cached data
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
          console.log(`✅ useOptimizedFinancialData: CACHE HIT - Using cached Zoho data (${zohoCacheCheck.data.length} transactions)`);
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
      
      console.log("📊 useOptimizedFinancialData: CACHE-FIRST SUMMARY", {
        totalTransactions: allTransactions.length,
        zohoSource: cacheStatus.zoho.hit ? 'CACHE' : 'API',
        stripeSource: cacheStatus.stripe.hit ? 'CACHE' : 'API',
        cacheEfficiency: `${cacheEfficiency.toFixed(1)}%`,
        usingCachedData: usingCache,
        apiCallsMade: totalSources - totalCacheHits,
        strategy: forceRefresh ? 'FORCE_REFRESH' : 'CACHE_FIRST'
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
        hasCachedData: allTransactions.length > 0
      });

    } catch (error) {
      console.error("❌ useOptimizedFinancialData: Error fetching data:", error);
      
      // Fallback to cached data if API fails and we don't already have data showing
      if (!data.transactions.length) {
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
      }
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isDataRequested: true,
        cacheChecked: true
      }));
    }
  }, [startDate, endDate, data.transactions.length]);

  console.log("🔄 useOptimizedFinancialData: Hook rendered with CACHE-FIRST strategy", {
    dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    hasData: data.transactions.length > 0,
    isDataRequested: data.isDataRequested,
    cacheChecked: data.cacheChecked,
    hasCachedData: data.hasCachedData,
    loading: data.loading,
    usingCachedData: data.usingCachedData
  });

  const refetch = useCallback((forceRefresh = false) => {
    console.log("🔄 useOptimizedFinancialData: Manual refetch requested", { 
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
