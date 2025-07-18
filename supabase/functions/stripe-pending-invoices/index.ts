
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not found");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    logStep("STRIPE_SECRET_KEY found, initializing client");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get pending invoices (draft, open, uncollectible)
    logStep("Fetching open invoices");
    const openInvoices = await stripe.invoices.list({
      status: 'open',
      limit: 100,
      expand: ['data.customer'], // Expand customer data directly
    });
    
    logStep("Fetching draft invoices");
    const draftInvoices = await stripe.invoices.list({
      status: 'draft',
      limit: 100,
      expand: ['data.customer'], // Expand customer data directly
    });

    logStep("Retrieved invoices", { 
      openCount: openInvoices.data.length, 
      draftCount: draftInvoices.data.length 
    });

    const allInvoices = [...openInvoices.data, ...draftInvoices.data];

    // Process invoices with batch customer lookup for missing data
    const customerCache = new Map();
    const pendingInvoices = [];

    for (const invoice of allInvoices) {
      let customerInfo = null;
      
      // First, try to use expanded customer data
      if (invoice.customer && typeof invoice.customer === 'object') {
        const customer = invoice.customer as any;
        customerInfo = {
          id: customer.id,
          email: customer.email || null,
          name: customer.name || customer.email || null,
        };
      } 
      // Fallback: Use customer email from invoice or customer ID
      else if (invoice.customer_email) {
        customerInfo = {
          id: invoice.customer as string || null,
          email: invoice.customer_email,
          name: invoice.customer_name || invoice.customer_email,
        };
      }
      // Last resort: Try to fetch customer if we have an ID and haven't cached it
      else if (invoice.customer && typeof invoice.customer === 'string') {
        const customerId = invoice.customer;
        
        if (!customerCache.has(customerId)) {
          try {
            await delay(100); // Rate limiting protection
            const customer = await stripe.customers.retrieve(customerId);
            customerCache.set(customerId, {
              id: customer.id,
              email: (customer as any).email || null,
              name: (customer as any).name || (customer as any).email || null,
            });
          } catch (error) {
            logStep("Error retrieving customer", { customerId, error: error.message });
            customerCache.set(customerId, {
              id: customerId,
              email: null,
              name: `Customer ${customerId.slice(-6)}`, // Show last 6 chars of ID
            });
          }
        }
        customerInfo = customerCache.get(customerId);
      }

      // Final fallback
      if (!customerInfo) {
        customerInfo = {
          id: null,
          email: null,
          name: 'Customer Information Unavailable',
        };
      }

      pendingInvoices.push({
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
      });
    }

    logStep("Transformed invoices successfully", { 
      count: pendingInvoices.length,
      customersFound: Array.from(customerCache.values()).filter(c => c.name !== 'Customer Information Unavailable').length
    });

    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        invoices: pendingInvoices,
        total_count: pendingInvoices.length
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error.stack });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      data: {
        invoices: []
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
