import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/financial';
import CacheService from '@/services/cache';
import { stripeRepository } from '@/repositories/stripeRepository';
import { zohoRepository } from '@/repositories/zohoRepository';
import { MonthlyCacheSync } from '@/services/cache/syncMonthlyCache';
import { DataIntegrityValidator } from '@/services/cache/validation/dataIntegrity';

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
      console.log("🔍 useOptimizedFinancialData: PASSIVE cache existence check with enhanced validation", {
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

        // Enhanced logging with data validation
        if (hasZohoCache) {
          const validation = DataIntegrityValidator.validateTransactionBatch(zohoCacheCheck.data || []);
          console.log("🔍 useOptimizedFinancialData: Zoho cache validation", {
            total: zohoCacheCheck.data?.length || 0,
            valid: validation.valid.length,
            invalid: validation.invalid.length
          });
        }

        if (hasStripeCache) {
          const validation = DataIntegrityValidator.validateTransactionBatch(stripeCacheCheck.data || []);
          console.log("🔍 useOptimizedFinancialData: Stripe cache validation", {
            total: stripeCacheCheck.data?.length || 0,
            valid: validation.valid.length,
            invalid: validation.invalid.length
          });
        }

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
    console.log("🚀 useOptimizedFinancialData: MANUAL fetch with enhanced operations", {
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      forceRefresh,
      currentDataCount: data.transactions.length,
      caller: new Error().stack?.split('\n')[2]?.trim()
    });
    
    // ENHANCED ATOMIC REFRESH: Use new atomic refresh operations
    if (forceRefresh && data.transactions.length > 0) {
      console.log("🔄 useOptimizedFinancialData: ENHANCED ATOMIC REFRESH - Using atomic operations");
      
      // Show refreshing state but keep existing data
      setData(prev => ({ 
        ...prev, 
        isRefreshing: true,
        error: null,
        cacheStatus: {
          zoho: { hit: false, partial: false },
          stripe: { hit: false, partial: false }
        },
        usingCachedData: false
      }));
      
      try {
        let allTransactions: Transaction[] = [];
        let stripeData: any = null;
        
        console.log("🌐 useOptimizedFinancialData: Using atomic refresh for both sources...");
        
        // Atomic refresh for Stripe data
        const stripeRefreshResult = await CacheService.atomicRefresh(
          'Stripe',
          startDate,
          endDate,
          async () => {
            const result = await stripeRepository.getTransactions(startDate, endDate, true);
            return result.transactions;
          }
        );

        if (stripeRefreshResult.success) {
          // Get fresh Stripe data from cache after atomic refresh
          const freshStripeCheck = await CacheService.checkCache('Stripe', startDate, endDate);
          if (freshStripeCheck.cached && freshStripeCheck.data) {
            const transactions = freshStripeCheck.data;
            allTransactions = [...allTransactions, ...transactions];
            
            // Reconstruct Stripe data object
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
            
            console.log(`📡 useOptimizedFinancialData: ATOMIC REFRESH - Refreshed ${transactions.length} Stripe transactions`);
          }
        }
        
        // Atomic refresh for Zoho data
        const zohoRefreshResult = await CacheService.atomicRefresh(
          'Zoho',
          startDate,
          endDate,
          async () => {
            return await zohoRepository.getTransactions(startDate, endDate, true);
          }
        );

        if (zohoRefreshResult.success) {
          // Get fresh Zoho data from cache after atomic refresh
          const freshZohoCheck = await CacheService.checkCache('Zoho', startDate, endDate);
          if (freshZohoCheck.cached && freshZohoCheck.data) {
            allTransactions = [...allTransactions, ...freshZohoCheck.data];
            console.log(`📡 useOptimizedFinancialData: ATOMIC REFRESH - Refreshed ${freshZohoCheck.data.length} Zoho transactions`);
          }
        }
        
        // Validate final data completeness
        const validation = DataIntegrityValidator.validateTransactionBatch(allTransactions);
        
        console.log("📊 useOptimizedFinancialData: ATOMIC REFRESH COMPLETED", {
          totalTransactions: allTransactions.length,
          validTransactions: validation.valid.length,
          invalidTransactions: validation.invalid.length,
          previousCount: data.transactions.length,
          dataUpdated: allTransactions.length !== data.transactions.length,
          refreshTime: new Date().toISOString(),
          stripeSuccess: stripeRefreshResult.success,
          zohoSuccess: zohoRefreshResult.success
        });
        
        // Update with fresh data
        setData(prev => ({
          ...prev,
          transactions: validation.valid.length > 0 ? validation.valid : allTransactions,
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
        console.error("❌ useOptimizedFinancialData: Error during atomic refresh:", error);
        
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

      // CACHE-FIRST STRATEGY with enhanced validation
      if (!forceRefresh) {
        console.log("🔍 useOptimizedFinancialData: Using CACHE-FIRST strategy with enhanced validation");
        
        // Check Stripe cache first
        const stripeCacheCheck = await CacheService.checkCache('Stripe', startDate, endDate);
        
        if (stripeCacheCheck.cached && stripeCacheCheck.data && stripeCacheCheck.data.length > 0) {
          // Validate cached Stripe data
          const validation = DataIntegrityValidator.validateTransactionBatch(stripeCacheCheck.data);
          const validTransactions = validation.valid.length > 0 ? validation.valid : stripeCacheCheck.data;
          
          console.log(`✅ useOptimizedFinancialData: CACHE HIT - Loading validated Stripe data (${validTransactions.length} transactions)`);
          
          const gross = validTransactions.reduce((sum, tx) => sum + (tx.gross || tx.amount), 0);
          const fees = validTransactions.reduce((sum, tx) => sum + (tx.fees || 0), 0);
          const net = gross - fees;
          const feePercentage = gross > 0 ? (fees / gross) * 100 : 0;
          
          stripeData = {
            transactions: validTransactions,
            gross,
            fees,
            transactionFees: fees,
            payoutFees: 0,
            additionalFees: 0,
            net,
            feePercentage
          };
          
          allTransactions = [...allTransactions, ...validTransactions];
          usingCache = true;
          cacheStatus.stripe = { hit: true, partial: stripeCacheCheck.partial };
        }

        // Check Zoho cache
        const zohoCacheCheck = await CacheService.checkCache('Zoho', startDate, endDate);
        
        if (zohoCacheCheck.cached && zohoCacheCheck.data && zohoCacheCheck.data.length > 0) {
          // Validate cached Zoho data
          const validation = DataIntegrityValidator.validateTransactionBatch(zohoCacheCheck.data);
          const validTransactions = validation.valid.length > 0 ? validation.valid : zohoCacheCheck.data;
          
          console.log(`✅ useOptimizedFinancialData: CACHE HIT - Loading validated Zoho data (${validTransactions.length} transactions)`);
          allTransactions = [...allTransactions, ...validTransactions];
          usingCache = true;
          cacheStatus.zoho = { hit: true, partial: zohoCacheCheck.partial };
        }
      }

      // Only fetch from API if we don't have cached data OR if force refresh is requested
      if (allTransactions.length === 0 || forceRefresh) {
        console.log("🌐 useOptimizedFinancialData: Fetching from API with enhanced storage", { 
          reason: forceRefresh ? 'force_refresh_or_cache_cleared' : 'no_cache_data' 
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
          const apiStripeData = await stripeRepository.getTransactions(startDate, endDate, forceRefresh);
          
          // Validate API data before storing
          const validation = DataIntegrityValidator.validateTransactionBatch(apiStripeData.transactions);
          const validTransactions = validation.valid.length > 0 ? validation.valid : apiStripeData.transactions;
          
          stripeData = {
            ...apiStripeData,
            transactions: validTransactions
          };
          allTransactions = [...allTransactions, ...validTransactions];
          cacheStatus.stripe = { hit: false, partial: false };
          console.log(`📡 useOptimizedFinancialData: API CALL - Fetched and validated ${validTransactions.length} Stripe transactions`);
        }

        // Fetch Zoho data if not cached or force refresh
        if (!cacheStatus.zoho.hit || forceRefresh) {
          console.log("🌐 useOptimizedFinancialData: Fetching Zoho data from API...");
          const apiZohoTransactions = await zohoRepository.getTransactions(startDate, endDate, forceRefresh);
          
          // Validate API data before adding
          const validation = DataIntegrityValidator.validateTransactionBatch(apiZohoTransactions);
          const validTransactions = validation.valid.length > 0 ? validation.valid : apiZohoTransactions;
          
          allTransactions = [...allTransactions, ...validTransactions];
          cacheStatus.zoho = { hit: false, partial: false };
          console.log(`📡 useOptimizedFinancialData: API CALL - Fetched and validated ${validTransactions.length} Zoho transactions`);
        }
      }

      // Final validation of all transactions
      const finalValidation = DataIntegrityValidator.validateTransactionBatch(allTransactions);
      const finalTransactions = finalValidation.valid.length > 0 ? finalValidation.valid : allTransactions;

      // Final summary
      const totalCacheHits = (cacheStatus.zoho.hit ? 1 : 0) + (cacheStatus.stripe.hit ? 1 : 0);
      const totalSources = 2;
      const cacheEfficiency = (totalCacheHits / totalSources) * 100;
      
      console.log("📊 useOptimizedFinancialData: ENHANCED LOAD SUMMARY", {
        totalTransactions: finalTransactions.length,
        validTransactions: finalValidation.valid.length,
        invalidTransactions: finalValidation.invalid.length,
        zohoSource: cacheStatus.zoho.hit ? 'CACHE' : 'API',
        stripeSource: cacheStatus.stripe.hit ? 'CACHE' : 'API',
        cacheEfficiency: `${cacheEfficiency.toFixed(1)}%`,
        usingCachedData: usingCache,
        apiCallsMade: totalSources - totalCacheHits,
        strategy: forceRefresh ? 'ENHANCED_ATOMIC_REFRESH' : 'CACHE_FIRST_ENHANCED',
        userAction: true
      });

      setData({
        transactions: finalTransactions,
        stripeData,
        loading: false,
        error: null,
        usingCachedData: usingCache,
        cacheStatus,
        isDataRequested: true,
        cacheChecked: true,
        hasCachedData: finalTransactions.length > 0,
        isRefreshing: false,
        lastRefreshTime: Date.now()
      });

    } catch (error) {
      console.error("❌ useOptimizedFinancialData: Error during enhanced fetch:", error);
      
      // Fallback to cached data if API fails
      console.log("🔄 useOptimizedFinancialData: API failed, attempting enhanced cache fallback");
      try {
        const [zohoCacheCheck, stripeCacheCheck] = await Promise.all([
          CacheService.checkCache('Zoho', startDate, endDate),
          CacheService.checkCache('Stripe', startDate, endDate)
        ]);
        
        let fallbackTransactions: Transaction[] = [];
        let fallbackStripeData: any = null;
        
        if (stripeCacheCheck.cached && stripeCacheCheck.data) {
          const validation = DataIntegrityValidator.validateTransactionBatch(stripeCacheCheck.data);
          const validTransactions = validation.valid.length > 0 ? validation.valid : stripeCacheCheck.data;
          fallbackTransactions = [...fallbackTransactions, ...validTransactions];
          
          const gross = validTransactions.reduce((sum, tx) => sum + (tx.gross || tx.amount), 0);
          const fees = validTransactions.reduce((sum, tx) => sum + (tx.fees || 0), 0);
          
          fallbackStripeData = {
            transactions: validTransactions,
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
          const validation = DataIntegrityValidator.validateTransactionBatch(zohoCacheCheck.data);
          const validTransactions = validation.valid.length > 0 ? validation.valid : zohoCacheCheck.data;
          fallbackTransactions = [...fallbackTransactions, ...validTransactions];
        }
        
        if (fallbackTransactions.length > 0) {
          console.log("✅ useOptimizedFinancialData: Using enhanced cached data as fallback after API error");
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
        console.error("❌ useOptimizedFinancialData: Enhanced cache fallback also failed:", fallbackError);
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

  console.log("🔄 useOptimizedFinancialData: Hook rendered - ENHANCED PASSIVE MODE", {
    dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    hasData: data.transactions.length > 0,
    isDataRequested: data.isDataRequested,
    cacheChecked: data.cacheChecked,
    hasCachedData: data.hasCachedData,
    loading: data.loading,
    isRefreshing: data.isRefreshing,
    usingCachedData: data.usingCachedData,
    enhancedOperations: true
  });

  const refetch = useCallback((forceRefresh = false) => {
    console.log("🔄 useOptimizedFinancialData: Enhanced manual refetch requested by user", { 
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
