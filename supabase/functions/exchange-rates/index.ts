
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

// Free currency API URL - using ExchangeRate-API's free endpoint
// In a production app, you might want to use a paid API with an API key
const API_URL = "https://open.er-api.com/v6/latest/USD";

interface ExchangeRateResponse {
  base_code: string;
  time_last_update_unix: number;
  rates: Record<string, number>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cacheTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Check if we have cached exchange rates
    const { data: cachedRates, error: cacheError } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);
      
    if (!cacheError && cachedRates && cachedRates.length > 0) {
      const lastUpdate = new Date(cachedRates[0].updated_at).getTime();
      const now = Date.now();
      
      // If cache is fresh (less than 24 hours old), return cached rates
      if (now - lastUpdate < cacheTime) {
        console.log("Returning cached exchange rates");
        return new Response(
          JSON.stringify(cachedRates[0]),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Fetch new rates from the API
    console.log("Fetching fresh exchange rates");
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch exchange rates:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch exchange rates" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const exchangeData: ExchangeRateResponse = await response.json();
    
    // Store the new rates in the database
    const { error: insertError } = await supabase
      .from("exchange_rates")
      .insert({
        base_currency: "USD",
        rates: exchangeData.rates,
        source: "open.er-api.com"
      });
      
    if (insertError) {
      console.error("Error storing exchange rates:", insertError);
      // Continue anyway, as we can still return the fetched rates even if storing fails
    }
    
    return new Response(
      JSON.stringify({
        base_currency: "USD",
        rates: exchangeData.rates,
        updated_at: new Date().toISOString(),
        source: "open.er-api.com"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Error in exchange-rates function:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
