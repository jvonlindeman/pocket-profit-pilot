import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { zohoRepository } from '@/repositories/zohoRepository';
import { addMonths } from 'date-fns';
import { 
  UpcomingSubscriptionPayment, 
  PendingActivationSubscription,
  ReceivablesSelection 
} from '@/types/financial';

interface ReceivablesData {
  stripeUpcomingPayments: UpcomingSubscriptionPayment[];
  stripeCurrentMonthPayments: UpcomingSubscriptionPayment[];
  stripeNextMonthPayments: UpcomingSubscriptionPayment[];
  stripePendingActivations: PendingActivationSubscription[];
  selections: ReceivablesSelection[];
  isLoading: boolean;
  error: string | null;
  stripeErrors: {
    upcomingPayments: string | null;
    pendingActivations: string | null;
  };
}

/**
 * Generate next month's payments from ALL active subscription data
 * This ensures we always have complete projections for ALL active subscriptions
 * FIXED: Add unique identifier for next month to prevent duplication
 */
const generateNextMonthFromAllSubscriptions = (allUpcomingPayments: UpcomingSubscriptionPayment[]): UpcomingSubscriptionPayment[] => {
  console.log('🔄 Generating next month payments from ALL active subscriptions...');
  console.log(`📊 Input: ${allUpcomingPayments.length} total active subscriptions`);
  
  const nextMonthPayments = allUpcomingPayments.map(payment => {
    try {
      // Add exactly 1 month to all relevant dates
      const nextPaymentDate = addMonths(new Date(payment.next_payment_date), 1);
      const nextPeriodStart = addMonths(new Date(payment.current_period_start), 1);
      const nextPeriodEnd = addMonths(new Date(payment.current_period_end), 1);
      
      const nextMonthPayment: UpcomingSubscriptionPayment = {
        ...payment, // Copy all existing data
        subscription_id: `${payment.subscription_id}_next_month`, // FIXED: Unique ID for next month
        next_payment_date: nextPaymentDate.toISOString(),
        current_period_start: nextPeriodStart.toISOString(),
        current_period_end: nextPeriodEnd.toISOString(),
        // Keep all amounts, commissions, and discounts exactly the same
      };
      
      console.log(`✅ Generated next month payment for ${payment.customer?.email || 'unknown'}: ${nextPaymentDate.toISOString()}`);
      return nextMonthPayment;
    } catch (error) {
      console.error(`❌ Error generating next month payment for subscription ${payment.subscription_id}:`, error);
      return null;
    }
  }).filter((payment): payment is UpcomingSubscriptionPayment => payment !== null);
  
  console.log(`🎉 Successfully generated ${nextMonthPayments.length} next month payments from ALL active subscriptions with unique IDs`);
  return nextMonthPayments;
};

/**
 * Filter current month payments by next_payment_date > today
 * This shows only subscriptions pending collection in the current month
 * FIXED: Add unique identifier for current month to prevent duplication
 */
const filterCurrentMonthPendingPayments = (payments: UpcomingSubscriptionPayment[], today: Date): UpcomingSubscriptionPayment[] => {
  console.log('🔍 Filtering current month payments by next_payment_date > today...');
  console.log(`📅 Today: ${today.toISOString()}`);
  console.log(`📊 Input payments: ${payments.length}`);
  
  const filtered = payments.filter(payment => {
    const nextPaymentDate = new Date(payment.next_payment_date);
    const isPending = nextPaymentDate > today;
    
    console.log(`💳 ${payment.customer?.email || 'unknown'}: ${nextPaymentDate.toISOString()} > ${today.toISOString()} = ${isPending}`);
    return isPending;
  }).map(payment => ({
    ...payment,
    subscription_id: `${payment.subscription_id}_current_month`, // FIXED: Unique ID for current month
  }));
  
  console.log(`✅ Filtered to ${filtered.length} pending payments for current month with unique IDs`);
  return filtered;
};

export const useReceivablesData = () => {
  const [data, setData] = useState<ReceivablesData>({
    stripeUpcomingPayments: [],
    stripeCurrentMonthPayments: [],
    stripeNextMonthPayments: [],
    stripePendingActivations: [],
    selections: [],
    isLoading: true,
    error: null,
    stripeErrors: {
      upcomingPayments: null,
      pendingActivations: null,
    },
  });

  const fetchZohoUnpaidInvoices = async () => {
    try {
      console.log('🔄 Fetching Zoho unpaid invoices directly...');
      
      // Get unpaid invoices directly from Zoho repository
      const unpaidInvoices = zohoRepository.getUnpaidInvoices();
      
      console.log('✅ Zoho unpaid invoices loaded:', {
        count: unpaidInvoices.length,
        totalAmount: unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0),
        invoices: unpaidInvoices.map(inv => ({
          customer: inv.customer_name,
          company: inv.company_name,
          amount: inv.balance
        }))
      });
      
      return unpaidInvoices;
    } catch (error) {
      console.error('❌ Error fetching Zoho unpaid invoices:', error);
      throw error;
    }
  };

  const fetchStripeReceivables = async () => {
    try {
      console.log('🔄 Starting Stripe receivables fetch...');
      
      const results = await Promise.allSettled([
        supabase.functions.invoke('stripe-upcoming-payments'),
        supabase.functions.invoke('stripe-pending-activations'),
      ]);

      console.log('📊 Stripe function results:', results.map((result, index) => ({
        function: ['upcoming-payments', 'pending-activations'][index],
        status: result.status,
        ...(result.status === 'fulfilled' ? { data: result.value } : { error: result.reason })
      })));

      // Process upcoming payments with FIXED LOGIC - ALWAYS generate next month from ALL subscriptions
      let stripeUpcomingPayments: UpcomingSubscriptionPayment[] = [];
      let stripeCurrentMonthPayments: UpcomingSubscriptionPayment[] = [];
      let stripeNextMonthPayments: UpcomingSubscriptionPayment[] = [];
      let upcomingPaymentsError: string | null = null;
      
      if (results[0].status === 'fulfilled') {
        const upcomingPaymentsRes = results[0].value;
        console.log('💰 Upcoming payments response:', upcomingPaymentsRes);
        
        if (upcomingPaymentsRes.error) {
          upcomingPaymentsError = `Upcoming payments error: ${upcomingPaymentsRes.error}`;
          console.error('❌ Stripe upcoming payments error:', upcomingPaymentsRes.error);
        } else if (upcomingPaymentsRes.data?.success) {
          const responseData = upcomingPaymentsRes.data.data;
          stripeUpcomingPayments = responseData?.upcoming_payments || [];
          
          // PLAN IMPLEMENTADO FIJO: SIEMPRE generar próximo mes desde TODAS las suscripciones activas
          const rawCurrentMonthPayments = responseData?.current_month_payments || [];
          const todayStr = responseData?.today || new Date().toISOString();
          const today = new Date(todayStr);
          
          console.log(`🚀 PLAN FIJO IMPLEMENTADO - CORRIGIENDO PRÓXIMO MES:`);
          console.log(`  - Total active subscriptions: ${stripeUpcomingPayments.length}`);
          console.log(`  - Raw current month payments: ${rawCurrentMonthPayments.length}`);
          console.log(`  - Today for filtering: ${today.toISOString()}`);
          console.log(`  - FIXED: Generar próximo mes desde TODAS las suscripciones activas con IDs únicos`);
          
          // Current month: Filter by next_payment_date > today (only pending collections) with unique IDs
          stripeCurrentMonthPayments = filterCurrentMonthPendingPayments(rawCurrentMonthPayments, today);
          
          // Next month: FIXED - SIEMPRE generar desde TODAS las suscripciones activas con IDs únicos
          stripeNextMonthPayments = generateNextMonthFromAllSubscriptions(stripeUpcomingPayments);
          
          console.log('✅ PLAN FIJO IMPLEMENTADO - Processed payments with UNIQUE IDs:', {
            total: stripeUpcomingPayments.length,
            currentMonthPending: stripeCurrentMonthPayments.length,
            nextMonthGenerated: stripeNextMonthPayments.length,
            logic: 'Current = pending only (unique IDs), Next = TODAS las suscripciones activas (unique IDs)',
            fixed: 'Next month now shows ALL active subscriptions with unique identifiers'
          });
        } else {
          upcomingPaymentsError = `Unexpected response format for upcoming payments`;
          console.error('❌ Unexpected upcoming payments response:', upcomingPaymentsRes);
        }
      } else {
        upcomingPaymentsError = `Function call failed: ${results[0].reason}`;
        console.error('❌ Stripe upcoming payments function failed:', results[0].reason);
      }

      // Process pending activations
      let stripePendingActivations: PendingActivationSubscription[] = [];
      let pendingActivationsError: string | null = null;
      
      if (results[1].status === 'fulfilled') {
        const pendingActivationsRes = results[1].value;
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
        pendingActivationsError = `Function call failed: ${results[1].reason}`;
        console.error('❌ Stripe pending activations function failed:', results[1].reason);
      }

      console.log('📈 PLAN FIJO IMPLEMENTADO - Final Stripe data summary with UNIQUE IDs:', {
        upcomingPayments: stripeUpcomingPayments.length,
        currentMonthPendingOnly: stripeCurrentMonthPayments.length,
        nextMonthAllActiveSubscriptions: stripeNextMonthPayments.length,
        planFixed: 'PRÓXIMO MES = SIEMPRE desde TODAS las suscripciones activas con IDs únicos',
        duplicatesFixed: 'Current and next month now have separate unique identifiers',
        errors: {
          upcomingPayments: upcomingPaymentsError,
          pendingActivations: pendingActivationsError,
        }
      });

      return {
        stripeUpcomingPayments,
        stripeCurrentMonthPayments,
        stripeNextMonthPayments,
        stripePendingActivations,
        stripeErrors: {
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
          user_id: null, // Set to null for anonymous access
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
      console.log('🚀 Starting PLAN IMPLEMENTADO receivables data refresh with UNIQUE IDs...');
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Fetch Stripe data
      const [stripeData, selections] = await Promise.all([
        fetchStripeReceivables(),
        fetchSelections(),
      ]);

      // Fetch Zoho unpaid invoices independently
      const zohoUnpaidInvoices = await fetchZohoUnpaidInvoices();
      console.log('📋 Zoho unpaid invoices in receivables data:', {
        count: zohoUnpaidInvoices.length,
        total: zohoUnpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0)
      });

      setData({
        ...stripeData,
        selections: selections as ReceivablesSelection[],
        isLoading: false,
        error: null,
      });

      console.log('🎉 PLAN IMPLEMENTADO receivables data refresh completed successfully with UNIQUE IDs');
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

  const retryStripeFunction = async (functionName: 'upcomingPayments' | 'pendingActivations') => {
    try {
      console.log(`🔄 Retrying Stripe function: ${functionName}`);
      
      const functionMap = {
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
          case 'upcomingPayments':
            const responseData = result.data.data;
            newData.stripeUpcomingPayments = responseData?.upcoming_payments || [];
            
            // Apply FIXED PLAN for retry as well with unique IDs
            const rawCurrentMonthPayments = responseData?.current_month_payments || [];
            const todayStr = responseData?.today || new Date().toISOString();
            const today = new Date(todayStr);
            
            // Current month: Filter by next_payment_date > today (only pending collections) with unique IDs
            newData.stripeCurrentMonthPayments = filterCurrentMonthPendingPayments(rawCurrentMonthPayments, today);
            
            // Next month: FIXED - SIEMPRE generar desde TODAS las suscripciones activas with unique IDs
            newData.stripeNextMonthPayments = generateNextMonthFromAllSubscriptions(newData.stripeUpcomingPayments);
            
            console.log(`🔄 PLAN FIJO applied during retry with UNIQUE IDs - Generated ${newData.stripeNextMonthPayments.length} next month payments from ALL active subscriptions`);
            
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
