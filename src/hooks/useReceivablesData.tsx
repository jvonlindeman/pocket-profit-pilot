import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { 
  PendingStripeInvoice, 
  UpcomingSubscriptionPayment, 
  PendingActivationSubscription,
  ReceivablesSelection 
} from '@/types/financial';

interface ReceivablesData {
  stripePendingInvoices: PendingStripeInvoice[];
  stripeUpcomingPayments: UpcomingSubscriptionPayment[];
  stripePendingActivations: PendingActivationSubscription[];
  selections: ReceivablesSelection[];
  isLoading: boolean;
  error: string | null;
}

export const useReceivablesData = () => {
  const [data, setData] = useState<ReceivablesData>({
    stripePendingInvoices: [],
    stripeUpcomingPayments: [],
    stripePendingActivations: [],
    selections: [],
    isLoading: true,
    error: null,
  });

  const fetchStripeReceivables = async () => {
    try {
      console.log('🔄 Fetching Stripe receivables data...');
      
      const [pendingInvoicesRes, upcomingPaymentsRes, pendingActivationsRes] = await Promise.all([
        supabase.functions.invoke('stripe-pending-invoices'),
        supabase.functions.invoke('stripe-upcoming-payments'),
        supabase.functions.invoke('stripe-pending-activations'),
      ]);

      const stripePendingInvoices = pendingInvoicesRes.data?.invoices || [];
      const stripeUpcomingPayments = upcomingPaymentsRes.data?.upcoming_payments || [];
      const stripePendingActivations = pendingActivationsRes.data?.pending_activations || [];

      console.log('✅ Stripe receivables fetched:', {
        pendingInvoices: stripePendingInvoices.length,
        upcomingPayments: stripeUpcomingPayments.length,
        pendingActivations: stripePendingActivations.length,
      });

      return {
        stripePendingInvoices,
        stripeUpcomingPayments,
        stripePendingActivations,
      };
    } catch (error) {
      console.error('❌ Error fetching Stripe receivables:', error);
      throw error;
    }
  };

  const fetchSelections = async () => {
    try {
      console.log('🔄 Fetching user selections...');
      
      const { data: selections, error } = await supabase
        .from('receivables_selections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Selections fetched:', selections?.length || 0);
      return selections || [];
    } catch (error) {
      console.error('❌ Error fetching selections:', error);
      throw error;
    }
  };

  const updateSelection = async (
    selectionType: ReceivablesSelection['selection_type'],
    itemId: string,
    selected: boolean,
    amount: number,
    metadata: any = {}
  ) => {
    try {
      const { error } = await supabase
        .from('receivables_selections')
        .upsert({
          selection_type: selectionType,
          item_id: itemId,
          selected,
          amount,
          metadata,
        }, {
          onConflict: 'selection_type,item_id'
        });

      if (error) throw error;

      // Refresh selections
      const newSelections = await fetchSelections();
      setData(prev => ({ ...prev, selections: newSelections as ReceivablesSelection[] }));

      return true;
    } catch (error) {
      console.error('❌ Error updating selection:', error);
      toast.error('Error updating selection');
      return false;
    }
  };

  const refreshData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [stripeData, selections] = await Promise.all([
        fetchStripeReceivables(),
        fetchSelections(),
      ]);

      setData({
        ...stripeData,
        selections: selections as ReceivablesSelection[],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Error refreshing receivables data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      toast.error('Error loading receivables data');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    ...data,
    updateSelection,
    refreshData,
  };
};