
import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/financial';
import CacheService from '@/services/cache';
import { stripeRepository } from '@/repositories/stripeRepository';
import { zohoRepository } from '@/repositories/zohoRepository';

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
    }
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      let allTransactions: Transaction[] = [];
      let stripeData: any = null;
      let usingCache = false;
      const cacheStatus = {
        zoho: { hit: false, partial: false },
        stripe: { hit: false, partial: false }
      };

      // Check Stripe cache first
      if (!forceRefresh) {
        console.log("useOptimizedFinancialData: Checking Stripe cache...");
        const stripeCacheCheck = await CacheService.checkCache('Stripe', startDate, endDate);
        
        if (stripeCacheCheck.cached && stripeCacheCheck.data && stripeCacheCheck.data.length > 0) {
          console.log(`useOptimizedFinancialData: Using cached Stripe data (${stripeCacheCheck.data.length} transactions)`);
          
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
      }

      // If no Stripe cache or force refresh, get from API
      if (!stripeData || forceRefresh) {
        console.log("useOptimizedFinancialData: Fetching Stripe data from API...");
        stripeData = await stripeRepository.getTransactions(startDate, endDate, forceRefresh);
        allTransactions = [...allTransactions, ...stripeData.transactions];
        cacheStatus.stripe = { hit: false, partial: false };
      }

      // Check Zoho cache
      if (!forceRefresh) {
        console.log("useOptimizedFinancialData: Checking Zoho cache...");
        const zohoCacheCheck = await CacheService.checkCache('Zoho', startDate, endDate);
        
        if (zohoCacheCheck.cached && zohoCacheCheck.data && zohoCacheCheck.data.length > 0) {
          console.log(`useOptimizedFinancialData: Using cached Zoho data (${zohoCacheCheck.data.length} transactions)`);
          allTransactions = [...allTransactions, ...zohoCacheCheck.data];
          usingCache = true;
          cacheStatus.zoho = { hit: true, partial: zohoCacheCheck.partial };
        } else {
          // Get Zoho data from API if not cached
          console.log("useOptimizedFinancialData: Fetching Zoho data from API...");
          const zohoTransactions = await zohoRepository.getTransactions(startDate, endDate);
          allTransactions = [...allTransactions, ...zohoTransactions];
          cacheStatus.zoho = { hit: false, partial: false };
        }
      } else {
        // Force refresh Zoho
        console.log("useOptimizedFinancialData: Force refreshing Zoho data...");
        const zohoTransactions = await zohoRepository.getTransactions(startDate, endDate);
        allTransactions = [...allTransactions, ...zohoTransactions];
        cacheStatus.zoho = { hit: false, partial: false };
      }

      setData({
        transactions: allTransactions,
        stripeData,
        loading: false,
        error: null,
        usingCachedData: usingCache,
        cacheStatus
      });

    } catch (error) {
      console.error("useOptimizedFinancialData: Error fetching data:", error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [startDate, endDate]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback((forceRefresh = false) => {
    return fetchData(forceRefresh);
  }, [fetchData]);

  return {
    ...data,
    refetch
  };
}
