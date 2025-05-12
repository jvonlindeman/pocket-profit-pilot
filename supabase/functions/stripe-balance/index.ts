
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();

    // Validate inputs
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize Stripe with secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    console.log(`Fetching Stripe balance transactions from ${startDate} to ${endDate}`);

    // Format date params for the Stripe API (Unix timestamps)
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000) + 86400; // Add one day to include the end date fully

    // Fetch balance transactions for the period
    const transactions = await stripe.balanceTransactions.list({
      limit: 100, // Adjust as needed
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
    });

    // Process transactions to calculate totals and organize data
    let totalGross = 0;
    let totalFees = 0;
    let totalNet = 0;
    let formattedTransactions = [];

    // Map transaction types to our internal types
    transactions.data.forEach(transaction => {
      const amount = transaction.amount / 100; // Convert from cents to dollars
      const fee = transaction.fee / 100; // Convert from cents to dollars
      const net = transaction.net / 100; // Convert from cents to dollars
      
      // Determine if this is income or expense (fees are considered part of income)
      const isCharge = transaction.type === 'charge' || 
                      transaction.type === 'payment';
      
      if (isCharge) {
        totalGross += amount;
        totalFees += fee;
        totalNet += net;

        // Format as our internal Transaction type
        formattedTransactions.push({
          id: `stripe-${transaction.id}`,
          date: new Date(transaction.created * 1000).toISOString().split('T')[0],
          amount: amount, // Gross amount
          fees: fee,
          net: net,
          description: transaction.description || 'Stripe Payment',
          category: 'Ingresos por plataforma',
          source: 'Stripe',
          type: 'income'
        });
      }
    });

    // Return structured data
    return new Response(
      JSON.stringify({
        transactions: formattedTransactions,
        summary: {
          gross: totalGross,
          fees: totalFees,
          net: totalNet,
          feePercentage: totalGross > 0 ? (totalFees / totalGross) * 100 : 0
        },
        status: 'success'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error fetching Stripe data:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to fetch Stripe data",
        status: 'error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
