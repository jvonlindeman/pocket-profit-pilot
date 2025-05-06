
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

// The make.com webhook URL
const makeWebhookUrl = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

interface TransactionRequest {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
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
    
    // No cached data or force refresh, fetch new data from make.com webhook
    console.log("Fetching fresh data from make.com webhook");
    
    // Format dates for the webhook (YYYY-MM-DD format)
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
    // Call the make.com webhook
    console.log("Calling make.com webhook:", makeWebhookUrl);
    const webhookResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        forceRefresh: forceRefresh
      })
    });
    
    console.log(`make.com webhook response status: ${webhookResponse.status}`);
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Failed to fetch data from make.com webhook:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch data from make.com webhook", 
          details: errorText 
        }),
        { status: webhookResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse the webhook response
    let webhookData;
    try {
      const responseText = await webhookResponse.text();
      console.log(`make.com webhook response: ${responseText}`);
      webhookData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse make.com webhook response:", e);
      return new Response(
        JSON.stringify({ error: "Failed to parse make.com webhook response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If we get valid transactions, update the cache
    // Note: We're now expecting the new JSON format - no need to transform strings
    if (webhookData) {
      try {
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
        
        // Add sync_date to transactions if not present
        // This would be updated for the new format but we're using the raw data instead
        
        // Insert new transactions into cache - using the raw response for now
        // We'll process it in the frontend instead
        console.log("Returning webhook data directly:", webhookData);
        
        // No longer caching transactions in structured format, returning raw data

      } catch (cacheError) {
        console.error("Error managing transaction cache:", cacheError);
        // Continue and return the transactions even if caching fails
      }
    } else {
      console.log("No structured data returned from make.com webhook");
    }
    
    console.log("Successfully fetched data from make.com webhook");
    return new Response(
      JSON.stringify(webhookData || {}),
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
