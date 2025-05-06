
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
      
      // Handle malformed JSON - Try to fix common issues with the response
      // The issue is JSON arrays being represented as strings, requiring preprocessing
      let fixedText = responseText;
      
      // Fix collaboradores array - look for string arrays and replace with proper JSON arrays
      if (fixedText.includes('"colaboradores": "')) {
        fixedText = fixedText.replace(/"colaboradores": "(.+?)"/, (match, p1) => {
          // Replace escaped quotes with actual quotes
          const unescaped = p1.replace(/\\"/g, '"');
          // Wrap in array brackets
          return `"colaboradores": [${unescaped}]`;
        });
      }
      
      // Fix expenses array
      if (fixedText.includes('"expenses": "')) {
        fixedText = fixedText.replace(/"expenses": "(.+?)"/, (match, p1) => {
          const unescaped = p1.replace(/\\"/g, '"');
          return `"expenses": [${unescaped}]`;
        });
      }
      
      // Fix payments array
      if (fixedText.includes('"payments": "')) {
        fixedText = fixedText.replace(/"payments": "(.+?)"/, (match, p1) => {
          const unescaped = p1.replace(/\\"/g, '"');
          return `"payments": [${unescaped}]`;
        });
      }
      
      webhookData = JSON.parse(fixedText);
    } catch (e) {
      console.error("Failed to parse make.com webhook response:", e);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse make.com webhook response", 
          details: e instanceof Error ? e.message : "Unknown error",
          suggestion: "El formato JSON de la respuesta del webhook parece incorrecto. Asegúrate que los arrays estén formateados correctamente."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Successfully fetched and parsed data from make.com webhook");
    return new Response(
      JSON.stringify(webhookData || {}),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Error in zoho-transactions function:", err);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: err instanceof Error ? err.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
