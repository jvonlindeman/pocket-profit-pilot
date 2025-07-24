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
          // Check in all Stripe payment arrays for matching subscription_id
          // For upcoming payments
          const upcomingPayment = receivablesData.stripeUpcomingPayments.find(p => 
            p.subscription_id === itemId || `${p.subscription_id}_upcoming` === itemId
          );
          if (upcomingPayment) {
            console.log('Found upcoming payment:', upcomingPayment.net_amount);
            stripeSelected += upcomingPayment.net_amount;
          }

          // For current month payments  
          const currentPayment = receivablesData.stripeCurrentMonthPayments.find(p => 
            p.subscription_id === itemId || `${p.subscription_id}_current_month` === itemId
          );
          if (currentPayment) {
            console.log('Found current month payment:', currentPayment.net_amount);
            stripeSelected += currentPayment.net_amount;
          }

          // For next month payments
          const nextPayment = receivablesData.stripeNextMonthPayments.find(p => 
            p.subscription_id === itemId || `${p.subscription_id}_next_month` === itemId
          );
          if (nextPayment) {
            console.log('Found next month payment:', nextPayment.net_amount);
            stripeSelected += nextPayment.net_amount;
          }
          
          // If no match found
          if (!upcomingPayment && !currentPayment && !nextPayment) {
            console.log('No matching Stripe payment found for:', itemId);
          }
        } else if (selectionData.selection_type === 'stripe_pending_activations') {
          // Check in pending activations
          const activation = receivablesData.stripePendingActivations.find(a => 
            a.subscription_id === itemId
          );
          if (activation) {
            console.log('Found pending activation:', activation.amount);
            stripeSelected += activation.amount;
          } else {
            console.log('No matching activation found for:', itemId);
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