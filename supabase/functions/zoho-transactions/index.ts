
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
    external_id: transaction.transaction_id || `zoho-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    date: transaction.date,
    amount: amount,
    description: transaction.reference_number || transaction.transaction_number || 'Zoho Transaction',
    category: transaction.account_name || transaction.transaction_type || 'Uncategorized',
    type: isIncome ? 'income' : 'expense',
    source: source,
    sync_date: new Date().toISOString()
  };
}

// Helper function to implement retry logic
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for ${url}`);
        // Exponential backoff: wait longer with each retry (300ms, 900ms, 2700ms, etc.)
        await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(3, attempt - 1)));
      }
      
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);
      lastError = err;
    }
  }
  
  throw lastError || new Error(`Failed to fetch after ${maxRetries} retries`);
}

serve(async (req: Request) => {
  console.log(`zoho-transactions function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the request body
    let requestBody: TransactionRequest;
    
    try {
      const text = await req.text();
      if (!text) {
        console.error("Empty request body");
        return new Response(
          JSON.stringify({ error: "Empty request body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      requestBody = JSON.parse(text);
      console.log("Request body parsed:", requestBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { startDate, endDate, forceRefresh = false } = requestBody;
    
    if (!startDate || !endDate) {
      console.error("Missing start or end date");
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if we have cached data for this date range and don't need to refresh
    if (!forceRefresh) {
      console.log("Checking for cached transactions");
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
          console.log("Returning cached Zoho transactions:", cachedTransactions.length);
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
    console.log("Calling zoho-tokens function");
    const tokenResponse = await fetchWithRetry(`${supabaseUrl}/functions/v1/zoho-tokens`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${supabaseServiceRoleKey}`,
      }
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to get Zoho token:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Zoho", details: errorText }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let tokenData;
    try {
      tokenData = await tokenResponse.json();
      console.log("Zoho token response:", JSON.stringify(tokenData));
    } catch (e) {
      console.error("Failed to parse token response:", e);
      const rawText = await tokenResponse.text();
      console.log("Raw token response:", rawText);
      return new Response(
        JSON.stringify({ error: "Failed to parse token response", details: rawText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!tokenData.access_token || !tokenData.organization_id) {
      console.error("Invalid token data:", tokenData);
      return new Response(
        JSON.stringify({ error: "Invalid Zoho credentials", details: "Missing access token or organization ID" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Format dates for Zoho API (YYYY-MM-DD format)
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
    // Use the correct Zoho API domain with region
    const region = tokenData.region || "com";
    const zohoApiUrl = `https://books.zoho.${region}/api/v3/banktransactions?organization_id=${tokenData.organization_id}&from_date=${formattedStartDate}&to_date=${formattedEndDate}`;
    
    console.log("Calling Zoho Books API:", zohoApiUrl);
    
    // Use the fetchWithRetry helper for better reliability
    const zohoResponse = await fetchWithRetry(zohoApiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${tokenData.access_token}`,
        "Content-Type": "application/json"
      }
    });
    
    // Log the complete response details for debugging
    console.log(`Zoho API response status: ${zohoResponse.status}`);
    console.log(`Zoho API response headers: ${JSON.stringify([...zohoResponse.headers])}`);
    
    // Get the response body text first for debugging purposes
    const responseText = await zohoResponse.text();
    console.log(`Zoho API response: ${responseText}`);
    
    if (!zohoResponse.ok) {
      console.error("Failed to fetch Zoho transactions:", responseText);
      
      // Better error handling for common Zoho API errors
      let errorMessage = "Failed to fetch Zoho transactions";
      
      if (responseText.includes("domain")) {
        errorMessage = "Incorrect Zoho API domain. Please verify your region configuration.";
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: responseText }),
        { status: zohoResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let zohoData;
    try {
      zohoData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Zoho response:", e);
      return new Response(
        JSON.stringify({ error: "Failed to parse Zoho response", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!zohoData.banktransactions) {
      console.log("No transactions found in Zoho response:", zohoData);
      // This might not be an error - just no transactions in the period
      const transactions = [];
      
      // We'll still cache the empty result
      console.log("Caching empty transaction result");
      return new Response(
        JSON.stringify(transactions),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Format the transactions and prepare for caching
    const transactions = zohoData.banktransactions.map((tx: any) => formatTransaction(tx));
    
    // Delete existing cached transactions for this date range and source
    console.log("Deleting existing cached transactions");
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
      console.log("Caching new transactions:", transactions.length);
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
    
    console.log("Successfully fetched and cached transactions:", transactions.length);
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
