
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
  stripeErrors: {
    pendingInvoices: string | null;
    upcomingPayments: string | null;
    pendingActivations: string | null;
  };
}

export const useReceivablesData = () => {
  const [data, setData] = useState<ReceivablesData>({
    stripePendingInvoices: [],
    stripeUpcomingPayments: [],
    stripePendingActivations: [],
    selections: [],
    isLoading: true,
    error: null,
    stripeErrors: {
      pendingInvoices: null,
      upcomingPayments: null,
      pendingActivations: null,
    },
  });

  const fetchStripeReceivables = async () => {
    try {
      console.log('🔄 Starting Stripe receivables fetch...');
      
      const results = await Promise.allSettled([
        supabase.functions.invoke('stripe-pending-invoices'),
        supabase.functions.invoke('stripe-upcoming-payments'),
        supabase.functions.invoke('stripe-pending-activations'),
      ]);

      console.log('📊 Stripe function results:', results.map((result, index) => ({
        function: ['pending-invoices', 'upcoming-payments', 'pending-activations'][index],
        status: result.status,
        ...(result.status === 'fulfilled' ? { data: result.value } : { error: result.reason })
      })));

      // Process pending invoices
      let stripePendingInvoices: PendingStripeInvoice[] = [];
      let pendingInvoicesError: string | null = null;
      
      if (results[0].status === 'fulfilled') {
        const pendingInvoicesRes = results[0].value;
        console.log('📧 Pending invoices response:', pendingInvoicesRes);
        
        if (pendingInvoicesRes.error) {
          pendingInvoicesError = `Pending invoices error: ${pendingInvoicesRes.error}`;
          console.error('❌ Stripe pending invoices error:', pendingInvoicesRes.error);
        } else if (pendingInvoicesRes.data?.success) {
          stripePendingInvoices = pendingInvoicesRes.data.data?.invoices || [];
          console.log('✅ Pending invoices loaded:', stripePendingInvoices.length);
        } else {
          pendingInvoicesError = `Unexpected response format for pending invoices`;
          console.error('❌ Unexpected pending invoices response:', pendingInvoicesRes);
        }
      } else {
        pendingInvoicesError = `Function call failed: ${results[0].reason}`;
        console.error('❌ Stripe pending invoices function failed:', results[0].reason);
      }

      // Process upcoming payments
      let stripeUpcomingPayments: UpcomingSubscriptionPayment[] = [];
      let upcomingPaymentsError: string | null = null;
      
      if (results[1].status === 'fulfilled') {
        const upcomingPaymentsRes = results[1].value;
        console.log('💰 Upcoming payments response:', upcomingPaymentsRes);
        
        if (upcomingPaymentsRes.error) {
          upcomingPaymentsError = `Upcoming payments error: ${upcomingPaymentsRes.error}`;
          console.error('❌ Stripe upcoming payments error:', upcomingPaymentsRes.error);
        } else if (upcomingPaymentsRes.data?.success) {
          stripeUpcomingPayments = upcomingPaymentsRes.data.data?.upcoming_payments || [];
          console.log('✅ Upcoming payments loaded:', stripeUpcomingPayments.length);
        } else {
          upcomingPaymentsError = `Unexpected response format for upcoming payments`;
          console.error('❌ Unexpected upcoming payments response:', upcomingPaymentsRes);
        }
      } else {
        upcomingPaymentsError = `Function call failed: ${results[1].reason}`;
        console.error('❌ Stripe upcoming payments function failed:', results[1].reason);
      }

      // Process pending activations
      let stripePendingActivations: PendingActivationSubscription[] = [];
      let pendingActivationsError: string | null = null;
      
      if (results[2].status === 'fulfilled') {
        const pendingActivationsRes = results[2].value;
        console.log('⚠️ Pending activations response:', pendingActivationsRes);
        
        if (pendingActivationsRes.error) {
          pendingActivationsError = `Pending activations error: ${pendingActivationsRes.error}`;
          console.error('❌ Stripe pending activations error:', pendingActivationsRes.error);
        } else if (pendingActivationsRes.data?.success) {
          stripePendingActivations = pendingActivationsRes.data.data?.pending_activations || [];
          console.log('✅ Pending activations loaded:', stripePendingActivations.length);
        } else {
          pendingActivationsError = `Unexpected response format for pending activations`;
          console.error('❌ Unexpected pending activations response:', pendingActivationsRes);
        }
      } else {
        pendingActivationsError = `Function call failed: ${results[2].reason}`;
        console.error('❌ Stripe pending activations function failed:', results[2].reason);
      }

      console.log('📈 Final Stripe data summary:', {
        pendingInvoices: stripePendingInvoices.length,
        upcomingPayments: stripeUpcomingPayments.length,
        pendingActivations: stripePendingActivations.length,
        errors: {
          pendingInvoices: pendingInvoicesError,
          upcomingPayments: upcomingPaymentsError,
          pendingActivations: pendingActivationsError,
        }
      });

      return {
        stripePendingInvoices,
        stripeUpcomingPayments,
        stripePendingActivations,
        stripeErrors: {
          pendingInvoices: pendingInvoicesError,
          upcomingPayments: upcomingPaymentsError,
          pendingActivations: pendingActivationsError,
        }
      };
    } catch (error) {
      console.error('❌ Critical error fetching Stripe receivables:', error);
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
      console.log('🔄 Updating selection:', { selectionType, itemId, selected, amount });
      
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
      setData(prev => ({ 
        ...prev, 
        selections: newSelections as ReceivablesSelection[] 
      }));

      console.log('✅ Selection updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating selection:', error);
      toast.error('Error updating selection');
      return false;
    }
  };

  const refreshData = async () => {
    try {
      console.log('🚀 Starting full data refresh...');
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

      console.log('🎉 Data refresh completed successfully');
    } catch (error) {
      console.error('❌ Error refreshing receivables data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error('Error loading receivables data');
    }
  };

  const retryStripeFunction = async (functionName: 'pendingInvoices' | 'upcomingPayments' | 'pendingActivations') => {
    try {
      console.log(`🔄 Retrying Stripe function: ${functionName}`);
      
      const functionMap = {
        pendingInvoices: 'stripe-pending-invoices',
        upcomingPayments: 'stripe-upcoming-payments',
        pendingActivations: 'stripe-pending-activations',
      };

      const result = await supabase.functions.invoke(functionMap[functionName]);
      console.log(`📊 Retry result for ${functionName}:`, result);
      
      if (result.error) {
        console.error(`❌ Retry failed for ${functionName}:`, result.error);
        toast.error(`Failed to retry ${functionName}`);
        return false;
      }

      if (!result.data?.success) {
        console.error(`❌ Retry failed for ${functionName}: Invalid response format`);
        toast.error(`Failed to retry ${functionName}`);
        return false;
      }

      console.log(`✅ Retry successful for ${functionName}:`, result.data);
      
      // Update specific data based on function
      setData(prev => {
        const newData = { ...prev };
        const newErrors = { ...prev.stripeErrors };
        
        switch (functionName) {
          case 'pendingInvoices':
            newData.stripePendingInvoices = result.data.data?.invoices || [];
            newErrors.pendingInvoices = null;
            break;
          case 'upcomingPayments':
            newData.stripeUpcomingPayments = result.data.data?.upcoming_payments || [];
            newErrors.upcomingPayments = null;
            break;
          case 'pendingActivations':
            newData.stripePendingActivations = result.data.data?.pending_activations || [];
            newErrors.pendingActivations = null;
            break;
        }
        
        newData.stripeErrors = newErrors;
        return newData;
      });

      toast.success(`${functionName} data refreshed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error retrying ${functionName}:`, error);
      toast.error(`Error retrying ${functionName}`);
      return false;
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    ...data,
    updateSelection,
    refreshData,
    retryStripeFunction,
  };
};
