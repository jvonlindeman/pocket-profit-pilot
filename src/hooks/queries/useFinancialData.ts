
import { useMemo } from 'react';
import { useZohoTransactions } from './useZohoTransactions';
import { useStripeTransactions } from './useStripeTransactions';
import { useCacheStatus } from './useCacheStatus';
import { useApiConnectivity } from './useApiConnectivity';
import { queryClient } from '@/lib/react-query/queryClient';
import { Transaction } from '@/types/financial';

export function useFinancialData(startDate: Date, endDate: Date) {
  // Fetch Zoho transactions with unpaid invoices
  const {
    data: zohoData,
    isLoading: zohoLoading,
    isError: zohoError,
    error: zohoErrorDetails,
    refetch: refetchZoho
  } = useZohoTransactions(startDate, endDate);

  // Extract transactions and unpaid invoices from Zoho data
  const zohoTransactions = useMemo(() => 
    zohoData?.transactions || [], [zohoData]);
  
  const unpaidInvoices = useMemo(() => 
    zohoData?.unpaidInvoices || [], [zohoData]);

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

  // FIXED: Proper error handling - return actual error messages or null
  const errorMessage = useMemo(() => {
    if (zohoError && zohoErrorDetails) {
      return `Error en Zoho: ${zohoErrorDetails.message || 'Error desconocido'}`;
    }
    if (stripeError && stripeErrorDetails) {
      return `Error en Stripe: ${stripeErrorDetails.message || 'Error desconocido'}`;
    }
    return null;
  }, [zohoError, zohoErrorDetails, stripeError, stripeErrorDetails]);

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

  console.log('🏠 useFinancialData: UPDATED FINAL RESULT with direct unpaid invoices:', {
    transactionCount: allTransactions.length,
    zohoTransactionsCount: zohoTransactions.length,
    stripeTransactionsCount: stripeTransactions.length,
    unpaidInvoicesCount: unpaidInvoices.length,
    unpaidInvoicesTotal: unpaidInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0),
    usingCachedData,
    errorMessage,
    dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    dataSource: 'direct_from_zoho_repository'
  });

  return {
    transactions: allTransactions,
    zohoTransactions,
    stripeTransactions,
    stripeData,
    unpaidInvoices, // CRITICAL: Direct from repository, not from queryClient
    loading: zohoLoading || stripeLoading,
    error: errorMessage, // FIXED: Return proper error message or null
    errorDetails: zohoError ? zohoErrorDetails : stripeErrorDetails,
    cacheStatus,
    cacheStatusLoading,
    apiConnectivity,
    refreshData,
    usingCachedData
  };
}
