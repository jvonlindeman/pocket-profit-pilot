
import { useMemo } from 'react';
import { useZohoTransactions } from './useZohoTransactions';
import { useStripeTransactions } from './useStripeTransactions';
import { useCacheStatus } from './useCacheStatus';
import { useApiConnectivity } from './useApiConnectivity';
import { queryClient } from '@/lib/react-query/queryClient';
import { Transaction } from '@/types/financial';
import { processUnpaidInvoices } from '@/services/zoho/api/processor';

export function useFinancialData(startDate: Date, endDate: Date) {
  // Fetch Zoho transactions
  const {
    data: zohoTransactions = [],
    isLoading: zohoLoading,
    isError: zohoError,
    error: zohoErrorDetails,
    refetch: refetchZoho
  } = useZohoTransactions(startDate, endDate);

  // Fetch Stripe transactions
  const {
    data: stripeData,
    isLoading: stripeLoading,
    isError: stripeError,
    error: stripeErrorDetails,
    refetch: refetchStripe
  } = useStripeTransactions(startDate, endDate);

  // Check cache status
  const { 
    data: cacheStatus,
    isLoading: cacheStatusLoading 
  } = useCacheStatus(startDate, endDate);

  // Check API connectivity
  const { data: apiConnectivity } = useApiConnectivity();

  // Get Stripe transactions from the Stripe data
  const stripeTransactions = useMemo(() => 
    stripeData?.transactions || [], [stripeData]);

  // Combine all transactions
  const allTransactions = useMemo(() => 
    [...zohoTransactions, ...stripeTransactions], 
    [zohoTransactions, stripeTransactions]);

  // Process unpaid invoices from Zoho data stored in queryClient
  const unpaidInvoices = useMemo(() => {
    // Get the raw Zoho response from queryClient
    const zohoRawData = queryClient.getQueryData<any>(
      ["zoho-transactions", startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );
    
    console.log('🔍 useFinancialData: Processing unpaid invoices from Zoho data', {
      hasZohoRawData: !!zohoRawData,
      zohoDataKeys: zohoRawData ? Object.keys(zohoRawData) : [],
      hasFacturasSinPagar: !!(zohoRawData?.facturas_sin_pagar),
      facturasSinPagarCount: Array.isArray(zohoRawData?.facturas_sin_pagar) ? zohoRawData.facturas_sin_pagar.length : 0
    });

    if (zohoRawData && zohoRawData.facturas_sin_pagar) {
      const processed = processUnpaidInvoices(zohoRawData);
      console.log('✅ useFinancialData: Processed unpaid invoices:', {
        count: processed.length,
        totalAmount: processed.reduce((sum, inv) => sum + inv.balance, 0)
      });
      return processed;
    }
    
    return [];
  }, [startDate, endDate, zohoTransactions.length]);

  // Force refresh function
  const refreshData = async (forceRefresh = false) => {
    if (forceRefresh) {
      // Invalidate queries to force refresh
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["zoho-transactions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["stripe-transactions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["cache-status"],
        }),
      ]);
    }
    
    // Refetch queries
    const [zohoResult, stripeResult] = await Promise.all([
      refetchZoho(),
      refetchStripe()
    ]);

    return zohoResult.isSuccess && stripeResult.isSuccess;
  };

  // Safely determine if we're using cached data
  const usingCachedData = useMemo(() => {
    return (
      cacheStatus?.zoho?.cached === true || 
      cacheStatus?.stripe?.cached === true
    );
  }, [cacheStatus]);

  return {
    transactions: allTransactions,
    zohoTransactions,
    stripeTransactions,
    stripeData,
    unpaidInvoices,
    loading: zohoLoading || stripeLoading,
    error: zohoError || stripeError,
    errorDetails: zohoError ? zohoErrorDetails : stripeErrorDetails,
    cacheStatus,
    cacheStatusLoading,
    apiConnectivity,
    refreshData,
    usingCachedData
  };
}
