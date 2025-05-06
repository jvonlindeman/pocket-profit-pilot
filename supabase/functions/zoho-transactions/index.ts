
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
          details: errorText,
          raw_response: errorText
        }),
        { status: webhookResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the raw response text
    const responseText = await webhookResponse.text();
    console.log(`make.com webhook raw response: ${responseText}`);
    
    // Parse the webhook response
    let webhookData;
    let originalResponse = responseText;
    
    try {
      // First try direct parsing
      webhookData = JSON.parse(responseText);
      console.log("Successfully parsed JSON directly");
    } catch (parseError) {
      console.log("Initial JSON parse failed, attempting to fix format");
      
      try {
        // Create a properly formatted JSON structure
        let fixedJson = responseText.trim();
        
        // Handle the case where the response is a string that needs to be parsed
        if (fixedJson.startsWith('"') && fixedJson.endsWith('"')) {
          try {
            // It might be a JSON string inside a string, try to parse the inner string
            const unescapedJson = JSON.parse(fixedJson);
            if (typeof unescapedJson === 'string') {
              console.log("Detected JSON string inside string, attempting to parse inner content");
              fixedJson = unescapedJson;
            }
          } catch (e) {
            console.error("Error unescaping JSON string:", e);
          }
        }
        
        // Special handling for colaboradores field if it's a string instead of an array
        if (fixedJson.includes('"colaboradores": "')) {
          fixedJson = fixedJson.replace(
            /"colaboradores": "([^"]*)"/g, 
            (match, captured) => {
              try {
                // Convert the string into a proper array by extracting objects
                const items = captured.match(/\{"key":\d+,"value":\{[^}]+\}\}/g) || [];
                const properArray = items.map(item => {
                  // Need to handle escaped quotes in the string
                  const cleanedItem = item.replace(/\\"/g, '"');
                  try {
                    const parsed = JSON.parse(cleanedItem);
                    return parsed.value;
                  } catch (e) {
                    console.error("Error parsing item:", cleanedItem, e);
                    return null;
                  }
                }).filter(Boolean);
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
                  // Need to handle escaped quotes in the string
                  const cleanedItem = item.replace(/\\"/g, '"');
                  try {
                    const parsed = JSON.parse(cleanedItem);
                    return parsed.value;
                  } catch (e) {
                    console.error("Error parsing item:", cleanedItem, e);
                    return null;
                  }
                }).filter(Boolean);
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
                  // Need to handle escaped quotes in the string
                  const cleanedItem = item.replace(/\\"/g, '"');
                  try {
                    const parsed = JSON.parse(cleanedItem);
                    return parsed.value;
                  } catch (e) {
                    console.error("Error parsing item:", cleanedItem, e);
                    return null;
                  }
                }).filter(Boolean);
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
          
          // As a fallback, return a structured response with the raw text
          return new Response(
            JSON.stringify({ 
              raw_response: originalResponse,
              error: "Could not parse webhook response",
              details: "The response from make.com could not be parsed as valid JSON."
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (fixError) {
        console.error("Error during fix attempt:", fixError);
        
        // As a fallback, return a structured response with the raw text
        return new Response(
          JSON.stringify({ 
            raw_response: originalResponse,
            error: "Could not process webhook response",
            details: fixError instanceof Error ? fixError.message : "Unknown error"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Add the original response to the data for debugging
    const responseData = {
      ...webhookData,
      raw_response: originalResponse
    };
    
    console.log("Successfully fetched and parsed data from make.com webhook");
    return new Response(
      JSON.stringify(responseData),
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
