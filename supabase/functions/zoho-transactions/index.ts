
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
      
      // The response text should already be a valid JSON format now, but let's handle potential issues
      try {
        // First try direct parsing
        webhookData = JSON.parse(responseText);
      } catch (parseError) {
        // If direct parsing fails, try to fix common issues
        console.log("Initial JSON parse failed, attempting to fix format");
        
        // Create a properly formatted JSON structure
        let fixedJson = responseText.trim();
        
        // Special handling for collaboradores field if it's a string instead of an array
        if (fixedJson.includes('"colaboradores": "')) {
          fixedJson = fixedJson.replace(
            /"colaboradores": "([^"]*)"/g, 
            (match, captured) => {
              try {
                // Convert the string into a proper array by extracting objects
                const items = captured.match(/\{"key":\d+,"value":\{[^}]+\}\}/g) || [];
                const properArray = items.map(item => {
                  const parsed = JSON.parse(item);
                  return parsed.value;
                });
                return `"colaboradores": ${JSON.stringify(properArray)}`;
              } catch (e) {
                console.error("Error converting colaboradores to array:", e);
                return '"colaboradores": []';
              }
            }
          );
        }
        
        // Special handling for expenses field if it's a string instead of an array
        if (fixedJson.includes('"expenses": "')) {
          fixedJson = fixedJson.replace(
            /"expenses": "([^"]*)"/g, 
            (match, captured) => {
              try {
                // Convert the string into a proper array by extracting objects
                const items = captured.match(/\{"key":\d+,"value":\{[^}]+\}\}/g) || [];
                const properArray = items.map(item => {
                  const parsed = JSON.parse(item);
                  return parsed.value;
                });
                return `"expenses": ${JSON.stringify(properArray)}`;
              } catch (e) {
                console.error("Error converting expenses to array:", e);
                return '"expenses": []';
              }
            }
          );
        }
        
        // Special handling for payments field if it's a string instead of an array
        if (fixedJson.includes('"payments": "')) {
          fixedJson = fixedJson.replace(
            /"payments": "([^"]*)"/g, 
            (match, captured) => {
              try {
                // Convert the string into a proper array by extracting objects
                const items = captured.match(/\{"key":\d+,"value":\{[^}]+\}\}/g) || [];
                const properArray = items.map(item => {
                  const parsed = JSON.parse(item);
                  return parsed.value;
                });
                return `"payments": ${JSON.stringify(properArray)}`;
              } catch (e) {
                console.error("Error converting payments to array:", e);
                return '"payments": []';
              }
            }
          );
        }
        
        // Try to parse the fixed JSON
        try {
          webhookData = JSON.parse(fixedJson);
          console.log("Successfully parsed fixed JSON");
        } catch (secondParseError) {
          console.error("Failed to parse fixed JSON:", secondParseError);
          throw new Error("Could not parse webhook response even after fixing");
        }
      }
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
