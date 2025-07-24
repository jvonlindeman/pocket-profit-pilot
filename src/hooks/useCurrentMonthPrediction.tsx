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
    
    console.log('useCurrentMonthPrediction - selections:', selections);
    console.log('useCurrentMonthPrediction - receivablesData:', {
      stripeUpcomingPayments: receivablesData.stripeUpcomingPayments?.length || 0,
      stripeCurrentMonthPayments: receivablesData.stripeCurrentMonthPayments?.length || 0,
      stripeNextMonthPayments: receivablesData.stripeNextMonthPayments?.length || 0,
      stripePendingActivations: receivablesData.stripePendingActivations?.length || 0
    });
    
    let stripeSelected = 0;
    let zohoSelected = 0;

    // Sum all selected items based on actual item_id from database
    Object.entries(selections).forEach(([itemId, selectionData]) => {
      console.log('Processing selection:', itemId, selectionData);
      
      if (selectionData.selected) {
        if (selectionData.selection_type === 'stripe_upcoming_payments') {
          // Extract base subscription_id by removing suffixes
          const baseSubscriptionId = itemId.replace(/_current_month|_next_month|_upcoming$/g, '');
          console.log('Extracted base subscription_id:', baseSubscriptionId, 'from itemId:', itemId);
          
          // Search in all Stripe payment arrays using base subscription_id
          const allStripePayments = [
            ...receivablesData.stripeUpcomingPayments,
            ...receivablesData.stripeCurrentMonthPayments,
            ...receivablesData.stripeNextMonthPayments
          ];
          
          const matchingPayment = allStripePayments.find(p => p.subscription_id === baseSubscriptionId);
          if (matchingPayment) {
            console.log('Found matching Stripe payment:', matchingPayment.net_amount, 'for base ID:', baseSubscriptionId);
            stripeSelected += matchingPayment.net_amount;
          } else {
            console.log('No matching Stripe payment found for base ID:', baseSubscriptionId);
          }
        } else if (selectionData.selection_type === 'stripe_pending_activations') {
          // Extract base subscription_id for activations too
          const baseSubscriptionId = itemId.replace(/_current_month|_next_month|_upcoming$/g, '');
          
          const activation = receivablesData.stripePendingActivations.find(a => 
            a.subscription_id === baseSubscriptionId
          );
          if (activation) {
            console.log('Found pending activation:', activation.amount, 'for base ID:', baseSubscriptionId);
            stripeSelected += activation.amount;
          } else {
            console.log('No matching activation found for base ID:', baseSubscriptionId);
          }
        } else if (selectionData.selection_type === 'zoho_invoices') {
          // For Zoho invoices, the itemId format is "{customer_name}-{balance}"
          const [customerName, balanceStr] = itemId.split('-');
          const balance = parseFloat(balanceStr);
          if (!isNaN(balance)) {
            console.log('Found Zoho invoice:', balance);
            zohoSelected += balance;
          } else {
            console.log('Invalid Zoho balance format:', itemId);
          }
        }
      }
    });

    console.log('Final calculation:', { stripeSelected, zohoSelected });

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