
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
    // Convert ISO date strings to Unix timestamps (seconds since epoch)
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    // Add one day to include the end date fully (end of the day)
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999); // Set to end of day
    const endTimestamp = Math.floor(endDateObj.getTime() / 1000);

    console.log(`Using timestamps: start=${startTimestamp}, end=${endTimestamp}`);
    console.log(`Formatted dates: start=${new Date(startTimestamp * 1000).toISOString()}, end=${new Date(endTimestamp * 1000).toISOString()}`);

    // Initialize variables for pagination
    let hasMore = true;
    let lastId = null;
    const allTransactions = [];
    
    // Fetch all transactions with pagination
    while (hasMore) {
      // Setup pagination parameters
      const paginationParams: any = {
        limit: 100, // Maximum allowed by Stripe
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        }
      };
      
      // Add starting_after for pagination if we have a last ID
      if (lastId) {
        paginationParams.starting_after = lastId;
      }
      
      console.log(`Fetching transactions with params:`, JSON.stringify(paginationParams));
      
      // Make the API call with pagination parameters
      const transactionBatch = await stripe.balanceTransactions.list(paginationParams);
      
      // Add the batch to our collection
      allTransactions.push(...transactionBatch.data);
      
      // Check if we need to paginate more
      hasMore = transactionBatch.has_more;
      if (hasMore && transactionBatch.data.length > 0) {
        // Get the ID of the last item for pagination
        lastId = transactionBatch.data[transactionBatch.data.length - 1].id;
      }
      
      console.log(`Fetched ${transactionBatch.data.length} transactions, has more: ${hasMore}`);
    }

    console.log(`Total transactions fetched: ${allTransactions.length}`);

    // For debugging: log transaction creation dates
    if (allTransactions.length > 0) {
      console.log("Transaction date range:");
      const dates = allTransactions.map(t => new Date(t.created * 1000));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString();
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString();
      console.log(`First transaction: ${minDate}`);
      console.log(`Last transaction: ${maxDate}`);
    }

    // Log transaction types for debugging
    const transactionTypes = {};
    allTransactions.forEach(t => {
      transactionTypes[t.type] = (transactionTypes[t.type] || 0) + 1;
    });
    console.log("Transaction types distribution:", JSON.stringify(transactionTypes));

    // Process transactions to calculate totals and organize data
    let totalGross = 0;
    let totalFees = 0;
    let totalPayoutFees = 0;
    let totalTransactionFees = 0;
    let totalNet = 0;
    let formattedTransactions = [];

    // Create a map to categorize transactions
    const transactionTypeMap = {
      'charge': 'income',
      'payment': 'income',
      'payment_refund': 'refund',
      'refund': 'refund',
      'payout': 'payout',
      'payout_failure': 'payout_failure',
      'payout_cancel': 'payout_cancel',
      'stripe_fee': 'fee',
      'transfer': 'transfer',
      'adjustment': 'adjustment'
      // Add other types as needed
    };

    // Process each transaction based on its type
    allTransactions.forEach(transaction => {
      const amount = transaction.amount / 100; // Convert from cents to dollars
      const fee = transaction.fee / 100; // Convert from cents to dollars
      const net = transaction.net / 100; // Convert from cents to dollars
      const type = transaction.type;
      
      const transactionCategory = transactionTypeMap[type] || 'other';
      
      // Process income transactions (charges and payments)
      if (transactionCategory === 'income') {
        totalGross += amount;
        totalTransactionFees += fee;
        totalFees += fee;
        totalNet += net;

        // Format as our internal Transaction type - using NET amount as main amount
        formattedTransactions.push({
          id: `stripe-${transaction.id}`,
          date: new Date(transaction.created * 1000).toISOString().split('T')[0],
          amount: net, // Using NET amount after fees
          fees: fee,
          gross: amount, // Keep track of the gross amount too
          description: transaction.description || 'Stripe Payment (Net after fees)',
          category: 'Ingresos por plataforma',
          source: 'Stripe',
          type: 'income'
        });
      } 
      // Process payout transactions
      else if (transactionCategory === 'payout') {
        // For payouts, the fee is usually shown as a separate transaction
        // but we'll track it anyway
        totalPayoutFees += fee;
        totalFees += fee;
        
        // We don't add payouts to formatted transactions since they represent
        // money moving from Stripe to bank, not actual income/expense

        console.log(`Payout: ${amount}, Fee: ${fee}, Net: ${net}, Description: ${transaction.description}`);
      }
      // Process refunds
      else if (transactionCategory === 'refund') {
        // For refunds, we adjust our gross and net totals
        totalGross -= amount;
        totalNet -= net;
        
        formattedTransactions.push({
          id: `stripe-refund-${transaction.id}`,
          date: new Date(transaction.created * 1000).toISOString().split('T')[0],
          amount: -net, // Negative to represent money going out
          fees: fee,
          gross: -amount,
          description: transaction.description || 'Stripe Refund',
          category: 'Devoluciones',
          source: 'Stripe',
          type: 'expense'
        });
      }
      // Log all other transaction types for debugging
      else {
        console.log(`Other transaction type: ${type}, Amount: ${amount}, Fee: ${fee}, Net: ${net}, Description: ${transaction.description || 'No description'}`);
      }
    });

    // Return structured data
    return new Response(
      JSON.stringify({
        transactions: formattedTransactions,
        summary: {
          gross: totalGross,
          fees: totalFees,
          transactionFees: totalTransactionFees,
          payoutFees: totalPayoutFees,
          net: totalNet,
          feePercentage: totalGross > 0 ? (totalFees / totalGross) * 100 : 0,
          transactionCount: formattedTransactions.length,
          totalTransactionCount: allTransactions.length,
          transactionTypes: transactionTypes
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
