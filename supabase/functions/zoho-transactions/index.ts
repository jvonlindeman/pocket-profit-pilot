
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
  rawResponse?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { startDate, endDate, forceRefresh, rawResponse } = body;
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "startDate and endDate are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Fetching Zoho transactions from ${startDate} to ${endDate}, rawResponse: ${rawResponse}`);

    // Get the webhook URL from environment variables
    const webhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "Webhook URL not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Generate a unique request ID for tracing
    const requestId = crypto.randomUUID();
    console.log(`Request ID: ${requestId}`);

    // Make direct call to the webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify({
        startDate,
        endDate,
        rawResponse: !!rawResponse,
        requestId,
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`Webhook error (${webhookResponse.status}): ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Webhook returned ${webhookResponse.status}`,
          details: errorText
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    // Parse webhook response
    let data;
    try {
      data = await webhookResponse.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid response from webhook", details: e.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    // Return the data directly without additional processing
    // This ensures the client receives the exact same structure every time
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
