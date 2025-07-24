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
    
    console.log('🧮 useCurrentMonthPrediction - DETAILED ANALYSIS');
    console.log('📊 Selections count:', Object.keys(selections).length);
    console.log('📊 Selected items:', Object.entries(selections).filter(([_, data]) => data.selected).length);
    console.log('📊 Stripe data arrays:', {
      stripeUpcomingPayments: receivablesData.stripeUpcomingPayments?.length || 0,
      stripeCurrentMonthPayments: receivablesData.stripeCurrentMonthPayments?.length || 0,
      stripeNextMonthPayments: receivablesData.stripeNextMonthPayments?.length || 0,
      stripePendingActivations: receivablesData.stripePendingActivations?.length || 0
    });
    console.log('📊 Sample Stripe IDs from each array:');
    console.log('  - stripeUpcomingPayments:', receivablesData.stripeUpcomingPayments?.slice(0, 2).map(p => p.subscription_id));
    console.log('  - stripeCurrentMonthPayments:', receivablesData.stripeCurrentMonthPayments?.slice(0, 2).map(p => p.subscription_id));
    console.log('  - stripeNextMonthPayments:', receivablesData.stripeNextMonthPayments?.slice(0, 2).map(p => p.subscription_id));
    
    let stripeSelected = 0;
    let zohoSelected = 0;

    // Sum all selected items based on actual item_id from database
    Object.entries(selections).forEach(([itemId, selectionData]) => {
      console.log('Processing selection:', itemId, selectionData);
      
      if (selectionData.selected) {
        if (selectionData.selection_type === 'stripe_upcoming_payments') {
          console.log('Processing Stripe selection with item_id:', itemId);
          
          let matchingPayment = null;
          
          // Route to correct array based on suffix
          if (itemId.endsWith('_current_month')) {
            // Search in current month payments with the suffixed ID
            matchingPayment = receivablesData.stripeCurrentMonthPayments.find(p => p.subscription_id === itemId);
            console.log('Searching in stripeCurrentMonthPayments for:', itemId);
          } else if (itemId.endsWith('_next_month')) {
            // Search in next month payments with the suffixed ID
            matchingPayment = receivablesData.stripeNextMonthPayments.find(p => p.subscription_id === itemId);
            console.log('Searching in stripeNextMonthPayments for:', itemId);
          } else {
            // Search in upcoming payments (no suffix or _upcoming suffix)
            const baseId = itemId.replace('_upcoming', '');
            matchingPayment = receivablesData.stripeUpcomingPayments.find(p => p.subscription_id === baseId);
            console.log('Searching in stripeUpcomingPayments for:', baseId);
          }
          
          if (matchingPayment) {
            console.log('Found matching Stripe payment:', matchingPayment.net_amount, 'for item_id:', itemId);
            stripeSelected += matchingPayment.net_amount;
          } else {
            console.log('No matching Stripe payment found for item_id:', itemId);
          }
        } else if (selectionData.selection_type === 'stripe_pending_activations') {
          // Use the full item_id directly for activations too
          console.log('Looking for pending activation with subscription_id:', itemId);
          
          const activation = receivablesData.stripePendingActivations.find(a => 
            a.subscription_id === itemId
          );
          if (activation) {
            console.log('Found pending activation:', activation.amount, 'for item_id:', itemId);
            stripeSelected += activation.amount;
          } else {
            console.log('No matching activation found for item_id:', itemId);
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