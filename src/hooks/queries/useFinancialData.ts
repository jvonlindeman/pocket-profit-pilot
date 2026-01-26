import { useMemo } from 'react';
import { useZohoTransactions } from './useZohoTransactions';
import { useStripeTransactions } from './useStripeTransactions';
import { useApiConnectivity } from './useApiConnectivity';
import { queryClient } from '@/lib/react-query/queryClient';

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

  // Check API connectivity
  const { data: apiConnectivity } = useApiConnectivity();

  // Get Stripe transactions from the Stripe data
  const stripeTransactions = useMemo(() => 
    stripeData?.transactions || [], [stripeData]);

  // Combine all transactions
  const allTransactions = useMemo(() => 
    [...zohoTransactions, ...stripeTransactions], 
    [zohoTransactions, stripeTransactions]);

  // Get unpaid invoices from Zoho repository through queryClient
  const unpaidInvoices = useMemo(() => {
    // This is a workaround since we are still transitioning to React Query
    // and don't have a dedicated query for unpaid invoices yet
    return queryClient.getQueryData<any>(
      ["zoho-unpaid-invoices"]
    ) || [];
  }, [zohoTransactions.length]);

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
      ]);
    }
    
    // Refetch queries
    const [zohoResult, stripeResult] = await Promise.all([
      refetchZoho(),
      refetchStripe()
    ]);

    return zohoResult.isSuccess && stripeResult.isSuccess;
  };

  // Cache status - always false since we don't use persistent cache
  const cacheStatus = {
    zoho: { cached: false, partial: false },
    stripe: { cached: false, partial: false }
  };

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
    cacheStatusLoading: false,
    apiConnectivity,
    refreshData,
    usingCachedData: false
  };
}
