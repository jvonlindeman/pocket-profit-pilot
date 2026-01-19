import { useMemo } from 'react';
import { useReceivablesData } from './useReceivablesData';
import { useReceivablesCalculations } from './useReceivablesCalculations';
import { zohoRepository } from '@/repositories/zohoRepository';

/**
 * Hook simplificado para obtener el Total Stripe (Neto + Bruto) y su 50%
 * Para uso en SalaryCalculator y otros componentes que necesiten este cálculo
 */
export const useStripeEstimated = (stripeNet: number, adjustedZohoIncome: number) => {
  const {
    stripeCurrentMonthPayments,
    stripeNextMonthPayments,
    stripePendingActivations,
    selections,
    isLoading,
  } = useReceivablesData();

  // Get Zoho unpaid invoices directly from repository
  const unpaidInvoices = zohoRepository.getUnpaidInvoices();

  const calculations = useReceivablesCalculations({
    unpaidInvoices,
    stripeUpcomingPayments: [],
    stripeCurrentMonthPayments,
    stripeNextMonthPayments,
    stripePendingActivations,
    selections,
    stripeNet,
    adjustedZohoIncome,
  });

  // 50% del Total Stripe (Neto + Bruto)
  const halfStripeEstimated = useMemo(() => {
    return calculations.totalStripeProjection / 2;
  }, [calculations.totalStripeProjection]);

  console.log('💎 useStripeEstimated:', {
    stripeGrossTotal: calculations.stripeGrossTotal,
    stripeNet,
    totalStripeProjection: calculations.totalStripeProjection,
    halfStripeEstimated,
    isLoading,
  });

  return {
    stripeGrossTotal: calculations.stripeGrossTotal,
    stripeNetTotal: calculations.stripeNetTotal,
    totalStripeProjection: calculations.totalStripeProjection,
    halfStripeEstimated,
    isLoading,
  };
};
