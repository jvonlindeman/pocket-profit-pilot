import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-UPCOMING-PAYMENTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe client initialized");

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    logStep("Retrieved active subscriptions", { count: subscriptions.data.length });

    // Transform to our format with upcoming payment info
    const upcomingPayments = await Promise.all(
      subscriptions.data.map(async (subscription) => {
        let customerInfo = null;
        let planInfo = null;

        // Get customer info
        if (subscription.customer) {
          try {
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            customerInfo = {
              id: customer.id,
              email: (customer as any).email || null,
              name: (customer as any).name || null,
            };
          } catch (error) {
            logStep("Error retrieving customer", { customerId: subscription.customer, error: error.message });
          }
        }

        // Get plan info from the first item (most subscriptions have one item)
        if (subscription.items.data.length > 0) {
          const item = subscription.items.data[0];
          const price = item.price;
          planInfo = {
            id: price.id,
            nickname: price.nickname,
            amount: price.unit_amount ? price.unit_amount / 100 : 0,
            currency: price.currency,
            interval: price.recurring?.interval,
            interval_count: price.recurring?.interval_count,
          };
        }

        // Calculate next payment date
        const nextPaymentDate = new Date(subscription.current_period_end * 1000);

        return {
          subscription_id: subscription.id,
          customer: customerInfo,
          plan_name: planInfo?.nickname || `${planInfo?.interval || 'monthly'} plan`,
          amount: planInfo?.amount || 0,
          currency: planInfo?.currency || 'usd',
          next_payment_date: nextPaymentDate.toISOString(),
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_date: new Date(subscription.created * 1000).toISOString(),
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        };
      })
    );

    // Filter to only include subscriptions with upcoming payments in the next 60 days
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    
    const filteredPayments = upcomingPayments.filter(payment => {
      const paymentDate = new Date(payment.next_payment_date);
      return paymentDate >= now && paymentDate <= sixtyDaysFromNow;
    });

    logStep("Filtered upcoming payments", { 
      total: upcomingPayments.length, 
      next60Days: filteredPayments.length 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      upcoming_payments: filteredPayments,
      total_count: filteredPayments.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      upcoming_payments: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});