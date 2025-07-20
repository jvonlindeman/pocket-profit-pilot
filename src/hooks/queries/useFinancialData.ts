
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

  // FIXED: Process unpaid invoices from Zoho data stored in queryClient
  const unpaidInvoices = useMemo(() => {
    // Get the raw Zoho response from queryClient
    const zohoRawData = queryClient.getQueryData<any>(
      ["zoho-transactions", startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );
    
    console.log('🔍 useFinancialData: ENHANCED Processing unpaid invoices from Zoho data', {
      hasZohoRawData: !!zohoRawData,
      zohoDataKeys: zohoRawData ? Object.keys(zohoRawData) : [],
      hasFacturasSinPagar: !!(zohoRawData?.facturas_sin_pagar),
      facturasSinPagarCount: Array.isArray(zohoRawData?.facturas_sin_pagar) ? zohoRawData.facturas_sin_pagar.length : 0,
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      zohoTransactionsCount: zohoTransactions.length
    });

    if (zohoRawData && zohoRawData.facturas_sin_pagar) {
      const processed = processUnpaidInvoices(zohoRawData);
      console.log('✅ useFinancialData: SUCCESSFULLY processed unpaid invoices:', {
        count: processed.length,
        totalAmount: processed.reduce((sum, inv) => sum + inv.balance, 0),
        sampleInvoices: processed.slice(0, 3).map(inv => ({
          customer: inv.customer_name,
          company: inv.company_name,
          balance: inv.balance,
          invoice_id: inv.invoice_id
        }))
      });
      return processed;
    }
    
    console.warn('⚠️ useFinancialData: No facturas_sin_pagar found in Zoho raw data');
    return [];
  }, [startDate, endDate, zohoTransactions.length]);

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

  console.log('🏠 useFinancialData: FINAL RESULT with enhanced unpaid invoices tracking:', {
    transactionCount: allTransactions.length,
    unpaidInvoicesCount: unpaidInvoices.length,
    unpaidInvoicesTotal: unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0),
    usingCachedData,
    errorMessage,
    dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
  });

  return {
    transactions: allTransactions,
    zohoTransactions,
    stripeTransactions,
    stripeData,
    unpaidInvoices, // CRITICAL: Ensure unpaid invoices are returned
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
