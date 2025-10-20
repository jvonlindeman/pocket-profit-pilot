import { useMemo } from 'react';
import { 
  UpcomingSubscriptionPayment, 
  PendingActivationSubscription,
  ReceivablesSelection 
} from '@/types/financial';

interface ReceivablesData {
  unpaidInvoices: Array<{
    customer_name: string;
    company_name?: string;
    balance: number;
  }>;
  stripeUpcomingPayments: UpcomingSubscriptionPayment[];
  stripeCurrentMonthPayments: UpcomingSubscriptionPayment[];
  stripeNextMonthPayments: UpcomingSubscriptionPayment[];
  stripePendingActivations: PendingActivationSubscription[];
  selections: ReceivablesSelection[];
  stripeNet: number;
  adjustedZohoIncome: number;
}

interface ReceivablesCalculations {
  zohoSelectedInvoices: number;
  zohoTotal: number;
  stripeGrossTotal: number;
  stripeNetTotal: number;
  grandGrossTotal: number;
  grandNetTotal: number;
  next30DaysGross: number;
  next30DaysNet: number;
  totalFeesCommissions: number;
  pendingActivationsTotal: number;
  totalStripeProjection: number;
  totalItems: number;
}

export const useReceivablesCalculations = (data: ReceivablesData): ReceivablesCalculations => {
  const {
    unpaidInvoices,
    stripeUpcomingPayments,
    stripeCurrentMonthPayments,
    stripeNextMonthPayments,
    stripePendingActivations,
    selections,
    stripeNet,
    adjustedZohoIncome,
  } = data;

  return useMemo(() => {
    console.log('🧮 RECEIVABLES CALCULATIONS HOOK:', {
      stripeNetProp: stripeNet,
      adjustedZohoIncome,
      selectionsCount: selections.length,
      currentMonthPayments: stripeCurrentMonthPayments.length,
      nextMonthPayments: stripeNextMonthPayments.length,
    });

    const getSelectedAmount = (type: string, items: any[], useNetAmount = false) => {
      return items.reduce((total, item) => {
        const itemId = type === 'zoho_invoices' 
          ? `${item.customer_name}-${item.balance}` 
          : item.subscription_id;
        
        const selection = selections.find(s => 
          s.selection_type === type && s.item_id === itemId
        );
        
        if (selection?.selected) {
          // For upcoming payments, use net_amount if available and requested
          const amount = (useNetAmount && item.net_amount !== undefined) 
            ? item.net_amount 
            : (item.balance || item.amount);
          return total + amount;
        }
        return total;
      }, 0);
    };

    // Function for automatic calculation (without considering selections)
    const getAutomaticTotal = (items: any[], useNetAmount = false) => {
      return items.reduce((total, item) => {
        const amount = (useNetAmount && item.net_amount !== undefined) 
          ? item.net_amount 
          : (item.balance || item.amount);
        return total + amount;
      }, 0);
    };

    // Calculate gross and net amounts for Stripe
    const getStripeAmounts = (items: UpcomingSubscriptionPayment[], type: string) => {
      const selectedGross = getSelectedAmount(type, items, false); // Use gross amount
      const selectedNet = getSelectedAmount(type, items, true); // Use net amount
      return { selectedGross, selectedNet };
    };

    // Separate totals for each channel (selected amounts)
    const zohoSelectedInvoices = getSelectedAmount('zoho_invoices', unpaidInvoices);
    
    // UPDATED: Total Zoho includes selected invoices + adjusted Zoho income (dinero real en banco)
    const zohoTotal = zohoSelectedInvoices + adjustedZohoIncome;
    
    const currentMonthAmounts = getStripeAmounts(stripeCurrentMonthPayments, 'stripe_upcoming_payments');
    const nextMonthAmounts = getStripeAmounts(stripeNextMonthPayments, 'stripe_upcoming_payments');
    const pendingActivationsTotal = getSelectedAmount('stripe_pending_activations', stripePendingActivations);
    
    // Total Stripe amounts (gross and net)
    const stripeGrossTotal = currentMonthAmounts.selectedGross + nextMonthAmounts.selectedGross + pendingActivationsTotal;
    const stripeNetTotal = currentMonthAmounts.selectedNet + nextMonthAmounts.selectedNet + pendingActivationsTotal;
    
    // Grand totals
    const grandGrossTotal = zohoTotal + stripeGrossTotal;
    const grandNetTotal = zohoTotal + stripeNetTotal;

    // Next 30 days calculation (automatic, regardless of selections) - use net amounts
    const next30DaysGross = getAutomaticTotal(stripeNextMonthPayments, false);
    const next30DaysNet = getAutomaticTotal(stripeNextMonthPayments, true);

    // Calculate total fees/commissions
    const totalFeesCommissions = grandGrossTotal - grandNetTotal;

    // CORRECT CALCULATION: Stripe Neto (receivables) + Stripe Neto (ya cobrado)
    const totalStripeProjection = stripeNetTotal + stripeNet;

    console.log('🧮 RECEIVABLES CALCULATIONS BREAKDOWN:', {
      zohoSelectedInvoices: `$${zohoSelectedInvoices.toFixed(2)} (facturas seleccionadas)`,
      adjustedZohoIncome: `$${adjustedZohoIncome.toFixed(2)} (dinero real en banco Zoho)`,
      zohoTotal: `$${zohoTotal.toFixed(2)} (Total Zoho = facturas + banco)`,
      stripeGrossTotal: `$${stripeGrossTotal.toFixed(2)} (receivables seleccionados bruto)`,
      stripeNetTotal: `$${stripeNetTotal.toFixed(2)} (receivables seleccionados neto)`,
      stripeNetProp: `$${stripeNet.toFixed(2)} (ya cobrado este mes, neto)`,
      totalStripeProjection: `$${totalStripeProjection.toFixed(2)} (Total Stripe Neto: receivables + cobrado)`,
    });

    return {
      zohoSelectedInvoices,
      zohoTotal,
      stripeGrossTotal,
      stripeNetTotal,
      grandGrossTotal,
      grandNetTotal,
      next30DaysGross,
      next30DaysNet,
      totalFeesCommissions,
      pendingActivationsTotal,
      totalStripeProjection,
      totalItems: unpaidInvoices.length + 
                  stripeCurrentMonthPayments.length + stripeNextMonthPayments.length + stripePendingActivations.length,
    };
  }, [unpaidInvoices, stripeCurrentMonthPayments, stripeNextMonthPayments, stripePendingActivations, selections, stripeNet, adjustedZohoIncome]);
};