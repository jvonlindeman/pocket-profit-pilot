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

    // Sum all selected items based on actual item_id from database
    Object.entries(selections).forEach(([itemId, selectionData]) => {
      if (selectionData.selected) {
        if (selectionData.selection_type === 'stripe_upcoming_payments') {
          // Check in all Stripe payment arrays for matching subscription_id
          // For upcoming payments
          const upcomingPayment = receivablesData.stripeUpcomingPayments.find(p => 
            p.subscription_id === itemId || `${p.subscription_id}_upcoming` === itemId
          );
          if (upcomingPayment) {
            stripeSelected += upcomingPayment.net_amount;
          }

          // For current month payments
          const currentPayment = receivablesData.stripeCurrentMonthPayments.find(p => 
            p.subscription_id === itemId || `${p.subscription_id}_current_month` === itemId
          );
          if (currentPayment) {
            stripeSelected += currentPayment.net_amount;
          }

          // For next month payments
          const nextPayment = receivablesData.stripeNextMonthPayments.find(p => 
            p.subscription_id === itemId || `${p.subscription_id}_next_month` === itemId
          );
          if (nextPayment) {
            stripeSelected += nextPayment.net_amount;
          }
        } else if (selectionData.selection_type === 'stripe_pending_activations') {
          // Check in pending activations
          const activation = receivablesData.stripePendingActivations.find(a => 
            a.subscription_id === itemId
          );
          if (activation) {
            stripeSelected += activation.amount;
          }
        } else if (selectionData.selection_type === 'zoho_invoices') {
          // For Zoho invoices, the itemId format is "{customer_name}-{balance}"
          const [customerName, balanceStr] = itemId.split('-');
          const balance = parseFloat(balanceStr);
          if (!isNaN(balance)) {
            zohoSelected += balance;
          }
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