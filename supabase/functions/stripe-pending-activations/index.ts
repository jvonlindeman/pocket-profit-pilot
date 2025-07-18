import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-PENDING-ACTIVATIONS] ${step}${detailsStr}`);
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

    // Get subscriptions that need activation (incomplete, incomplete_expired, past_due)
    const incompleteSubscriptions = await stripe.subscriptions.list({
      status: 'incomplete',
      limit: 100,
    });

    const incompleteExpiredSubscriptions = await stripe.subscriptions.list({
      status: 'incomplete_expired',
      limit: 100,
    });

    const pastDueSubscriptions = await stripe.subscriptions.list({
      status: 'past_due',
      limit: 100,
    });

    logStep("Retrieved pending subscriptions", { 
      incomplete: incompleteSubscriptions.data.length,
      incompleteExpired: incompleteExpiredSubscriptions.data.length,
      pastDue: pastDueSubscriptions.data.length
    });

    const allPendingSubscriptions = [
      ...incompleteSubscriptions.data,
      ...incompleteExpiredSubscriptions.data,
      ...pastDueSubscriptions.data,
    ];

    // Transform to our format
    const pendingActivations = await Promise.all(
      allPendingSubscriptions.map(async (subscription) => {
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

        // Get plan info from the first item
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

        // Get latest invoice to understand what needs to be paid
        let latestInvoice = null;
        if (subscription.latest_invoice) {
          try {
            latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
          } catch (error) {
            logStep("Error retrieving latest invoice", { invoiceId: subscription.latest_invoice, error: error.message });
          }
        }

        return {
          subscription_id: subscription.id,
          customer: customerInfo,
          plan_name: planInfo?.nickname || `${planInfo?.interval || 'monthly'} plan`,
          amount: planInfo?.amount || 0,
          currency: planInfo?.currency || 'usd',
          status: subscription.status,
          created_date: new Date(subscription.created * 1000).toISOString(),
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          latest_invoice: latestInvoice ? {
            id: latestInvoice.id,
            amount_due: latestInvoice.amount_due / 100,
            status: latestInvoice.status,
            hosted_invoice_url: latestInvoice.hosted_invoice_url,
          } : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          days_until_due: subscription.days_until_due,
        };
      })
    );

    logStep("Transformed pending activations", { count: pendingActivations.length });

    return new Response(JSON.stringify({ 
      success: true, 
      pending_activations: pendingActivations,
      total_count: pendingActivations.length
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
      pending_activations: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});