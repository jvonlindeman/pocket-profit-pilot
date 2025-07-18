import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-PENDING-INVOICES] ${step}${detailsStr}`);
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

    // Get pending invoices (draft, open, uncollectible)
    const invoices = await stripe.invoices.list({
      status: 'open',
      limit: 100,
    });
    
    // Also get draft invoices
    const draftInvoices = await stripe.invoices.list({
      status: 'draft',
      limit: 100,
    });

    logStep("Retrieved invoices", { 
      openCount: invoices.data.length, 
      draftCount: draftInvoices.data.length 
    });

    const allInvoices = [...invoices.data, ...draftInvoices.data];

    // Transform to our format
    const pendingInvoices = await Promise.all(
      allInvoices.map(async (invoice) => {
        let customerInfo = null;
        if (invoice.customer) {
          try {
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            customerInfo = {
              id: customer.id,
              email: (customer as any).email || null,
              name: (customer as any).name || null,
            };
          } catch (error) {
            logStep("Error retrieving customer", { customerId: invoice.customer, error: error.message });
          }
        }

        return {
          invoice_id: invoice.id,
          customer: customerInfo,
          amount_due: invoice.amount_due / 100, // Convert from cents
          currency: invoice.currency,
          due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
          status: invoice.status,
          pdf_url: invoice.invoice_pdf,
          description: invoice.description || `Invoice ${invoice.number || invoice.id}`,
          created_date: new Date(invoice.created * 1000).toISOString(),
          number: invoice.number,
        };
      })
    );

    logStep("Transformed invoices", { count: pendingInvoices.length });

    return new Response(JSON.stringify({ 
      success: true, 
      invoices: pendingInvoices,
      total_count: pendingInvoices.length
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
      invoices: []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});