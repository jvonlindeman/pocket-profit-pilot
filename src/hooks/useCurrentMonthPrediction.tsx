import { useMemo } from 'react';
import { useReceivablesData } from './useReceivablesData';
import { useFinance } from '@/contexts/FinanceContext';

interface CurrentMonthPrediction {
  alreadyReceived: number;
  pendingSelected: number;
  totalExpected: number;
  progressPercentage: number;
  stripeSelected: number;
  zohoSelected: number;
}

export const useCurrentMonthPrediction = (): CurrentMonthPrediction => {
  const receivablesData = useReceivablesData();
  const { summary } = useFinance();

  const prediction = useMemo(() => {
    const { selections } = receivablesData;
    
    let stripeSelected = 0;
    let zohoSelected = 0;

    // Sum all selected items
    Object.entries(selections).forEach(([key, selected]) => {
      if (selected) {
        // Parse the key to determine source and find the amount
        if (key.startsWith('stripe-upcoming-')) {
          const paymentId = key.replace('stripe-upcoming-', '');
          const payment = receivablesData.stripeUpcomingPayments.find(p => p.subscription_id === paymentId);
          if (payment) {
            stripeSelected += payment.net_amount; // Use net_amount from type definition
          }
        } else if (key.startsWith('stripe-current-')) {
          const paymentId = key.replace('stripe-current-', '');
          const payment = receivablesData.stripeCurrentMonthPayments.find(p => p.subscription_id === paymentId);
          if (payment) {
            stripeSelected += payment.net_amount; // Use net_amount from type definition
          }
        } else if (key.startsWith('stripe-next-')) {
          const paymentId = key.replace('stripe-next-', '');
          const payment = receivablesData.stripeNextMonthPayments.find(p => p.subscription_id === paymentId);
          if (payment) {
            stripeSelected += payment.net_amount; // Use net_amount from type definition
          }
        } else if (key.startsWith('stripe-pending-')) {
          const activationId = key.replace('stripe-pending-', '');
          const activation = receivablesData.stripePendingActivations.find(a => a.subscription_id === activationId);
          if (activation) {
            stripeSelected += activation.amount; // Use amount from type definition
          }
        } else if (key.startsWith('zoho-')) {
          const invoiceId = key.replace('zoho-', '');
          // Note: zohoUnpaidInvoices might need to be added to the receivablesData interface
          // For now, we'll access it through the useReceivablesData hook structure
        }
      }
    });

    const alreadyReceived = summary.totalIncome;
    const pendingSelected = stripeSelected + zohoSelected;
    const totalExpected = alreadyReceived + pendingSelected;
    const progressPercentage = totalExpected > 0 ? (alreadyReceived / totalExpected) * 100 : 0;

    return {
      alreadyReceived,
      pendingSelected,
      totalExpected,
      progressPercentage,
      stripeSelected,
      zohoSelected,
    };
  }, [receivablesData, summary.totalIncome]);

  return prediction;
};