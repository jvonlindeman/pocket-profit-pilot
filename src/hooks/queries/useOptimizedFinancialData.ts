import { useState, useCallback } from 'react';
import { Transaction } from '@/types/financial';
import { stripeRepository } from '@/repositories/stripeRepository';
import { zohoRepository } from '@/repositories/zohoRepository';

interface FinancialData {
  transactions: Transaction[];
  stripeData?: any;
  loading: boolean;
  error: string | null;
  isDataRequested: boolean;
  isRefreshing: boolean;
  lastRefreshTime?: number;
}

/**
 * Optimized financial data hook - simplified without persistent cache
 * React Query handles in-memory caching
 */
export function useOptimizedFinancialData(startDate: Date, endDate: Date) {
  const [data, setData] = useState<FinancialData>({
    transactions: [],
    loading: false,
    error: null,
    isDataRequested: false,
    isRefreshing: false
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    console.log("🚀 useOptimizedFinancialData: MANUAL fetch requested by user action", {
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      forceRefresh,
      currentDataCount: data.transactions.length
    });
    
    // For force refresh with existing data, show refreshing state
    if (forceRefresh && data.transactions.length > 0) {
      console.log("🔄 useOptimizedFinancialData: REFRESH - Fetching fresh data");
      
      setData(prev => ({ 
        ...prev, 
        isRefreshing: true,
        error: null
      }));
      
      try {
        let allTransactions: Transaction[] = [];
        let stripeData: any = null;
        
        console.log("🌐 useOptimizedFinancialData: Fetching fresh data from APIs...");
        
        // Fetch Stripe data
        stripeData = await stripeRepository.getTransactions(startDate, endDate, true);
        allTransactions = [...allTransactions, ...stripeData.transactions];
        console.log(`📡 Fetched ${stripeData.transactions.length} fresh Stripe transactions`);
        
        // Fetch Zoho data
        const zohoTransactions = await zohoRepository.getTransactions(startDate, endDate, true);
        allTransactions = [...allTransactions, ...zohoTransactions];
        console.log(`📡 Fetched ${zohoTransactions.length} fresh Zoho transactions`);
        
        console.log("📊 useOptimizedFinancialData: REFRESH COMPLETED", {
          totalTransactions: allTransactions.length,
          previousCount: data.transactions.length,
          refreshTime: new Date().toISOString()
        });
        
        // Update with fresh data
        setData(prev => ({
          ...prev,
          transactions: allTransactions,
          stripeData,
          isRefreshing: false,
          error: null,
          lastRefreshTime: Date.now()
        }));
        
        return;
      } catch (error) {
        console.error("❌ useOptimizedFinancialData: Error during refresh:", error);
        
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

      console.log("🌐 useOptimizedFinancialData: Fetching from API");

      // Fetch Stripe data
      console.log("🌐 Fetching Stripe data from API...");
      stripeData = await stripeRepository.getTransactions(startDate, endDate, forceRefresh);
      allTransactions = [...allTransactions, ...stripeData.transactions];
      console.log(`📡 Fetched ${stripeData.transactions.length} Stripe transactions`);

      // Fetch Zoho data
      console.log("🌐 Fetching Zoho data from API...");
      const zohoTransactions = await zohoRepository.getTransactions(startDate, endDate, forceRefresh);
      allTransactions = [...allTransactions, ...zohoTransactions];
      console.log(`📡 Fetched ${zohoTransactions.length} Zoho transactions`);

      console.log("📊 useOptimizedFinancialData: LOAD SUMMARY", {
        totalTransactions: allTransactions.length,
        stripeCount: stripeData.transactions.length,
        zohoCount: zohoTransactions.length
      });

      setData({
        transactions: allTransactions,
        stripeData,
        loading: false,
        error: null,
        isDataRequested: true,
        isRefreshing: false,
        lastRefreshTime: Date.now()
      });

    } catch (error) {
      console.error("❌ useOptimizedFinancialData: Error during fetch:", error);
      
      setData(prev => ({
        ...prev,
        loading: false,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isDataRequested: true
      }));
    }
  }, [startDate, endDate, data.transactions.length]);

  const refetch = useCallback((forceRefresh = false) => {
    console.log("🔄 useOptimizedFinancialData: Manual refetch requested", { 
      forceRefresh
    });
    return fetchData(forceRefresh);
  }, [fetchData]);

  return {
    ...data,
    refetch
  };
}
