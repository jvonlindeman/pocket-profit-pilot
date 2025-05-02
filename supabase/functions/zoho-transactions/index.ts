
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface TransactionRequest {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}

// Format transaction data from Zoho to match our database schema
function formatTransaction(transaction: any, source = 'Zoho') {
  // Determine if it's income or expense based on transaction type
  const isIncome = transaction.transaction_type === 'customer_payment' || 
                  transaction.transaction_type === 'sales_invoice' ||
                  transaction.transaction_type === 'credit_note';
  
  // Get the amount (we assume all amounts are in USD)
  const amount = Math.abs(parseFloat(transaction.amount || transaction.total || '0'));
  
  return {
    external_id: transaction.transaction_id,
    date: transaction.date,
    amount: amount,
    description: transaction.reference_number || transaction.transaction_number || 'Zoho Transaction',
    category: transaction.account_name || transaction.transaction_type || 'Uncategorized',
    type: isIncome ? 'income' : 'expense',
    source: source
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the request body
    const { startDate, endDate, forceRefresh = false }: TransactionRequest = await req.json();
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if we have cached data for this date range and don't need to refresh
    if (!forceRefresh) {
      const { data: cachedTransactions, error: cacheError } = await supabase
        .from("cached_transactions")
        .select("*")
        .eq("source", "Zoho")
        .gte("date", startDate)
        .lte("date", endDate);
        
      if (!cacheError && cachedTransactions && cachedTransactions.length > 0) {
        // Check if the data is recent (within the last hour)
        const latestSync = new Date(Math.max(...cachedTransactions.map(tx => new Date(tx.sync_date).getTime())));
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (latestSync > oneHourAgo) {
          console.log("Returning cached Zoho transactions");
          return new Response(
            JSON.stringify(cachedTransactions),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    
    // No cached data or force refresh, fetch new data from Zoho
    console.log("Fetching fresh data from Zoho API");
    
    // Get Zoho access token
    const tokenResponse = await fetch(`${supabaseUrl}/functions/v1/zoho-tokens`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${supabaseServiceRoleKey}`,
      }
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to get Zoho token:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Zoho" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { access_token, organization_id } = await tokenResponse.json();
    
    if (!access_token || !organization_id) {
      return new Response(
        JSON.stringify({ error: "Invalid Zoho credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Format dates for Zoho API (YYYY-MM-DD format)
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
    // Fetch transactions from Zoho
    const zohoApiUrl = `https://books.zoho.com/api/v3/banktransactions?organization_id=${organization_id}&from_date=${formattedStartDate}&to_date=${formattedEndDate}`;
    
    const zohoResponse = await fetch(zohoApiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${access_token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!zohoResponse.ok) {
      const errorText = await zohoResponse.text();
      console.error("Failed to fetch Zoho transactions:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Zoho transactions", details: errorText }),
        { status: zohoResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const zohoData = await zohoResponse.json();
    
    if (!zohoData.banktransactions) {
      console.log("No transactions found in Zoho response");
      return new Response(
        JSON.stringify({ error: "Invalid Zoho response format or no transactions found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Format the transactions and prepare for caching
    const transactions = zohoData.banktransactions.map((tx: any) => formatTransaction(tx));
    
    // Delete existing cached transactions for this date range and source
    const { error: deleteError } = await supabase
      .from("cached_transactions")
      .delete()
      .eq("source", "Zoho")
      .gte("date", startDate)
      .lte("date", endDate);
      
    if (deleteError) {
      console.error("Error deleting old cached transactions:", deleteError);
    }
    
    // Insert new transactions into cache
    if (transactions.length > 0) {
      const { error: insertError } = await supabase
        .from("cached_transactions")
        .insert(transactions);
        
      if (insertError) {
        console.error("Error caching transactions:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to cache transactions", details: insertError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    return new Response(
      JSON.stringify(transactions),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Error in zoho-transactions function:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
