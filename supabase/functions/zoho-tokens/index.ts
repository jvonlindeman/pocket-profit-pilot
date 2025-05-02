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

interface RefreshTokenRequest {
  refreshToken?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the current integration record
    const { data: integration, error: fetchError } = await supabase
      .from("zoho_integration")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching Zoho integration:", fetchError);
      return new Response(
        JSON.stringify({ error: "No Zoho integration found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if we need to refresh the token
    const now = new Date();
    const tokenExpiry = integration.token_expires_at ? new Date(integration.token_expires_at) : new Date(0);
    
    // If token is valid and not expired, return it
    if (integration.access_token && tokenExpiry > now) {
      return new Response(
        JSON.stringify({ 
          access_token: integration.access_token,
          organization_id: integration.organization_id,
          expires_at: integration.token_expires_at
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Otherwise, refresh the token
    console.log("Token expired, refreshing...");
    
    const refreshToken = integration.refresh_token;
    const clientId = integration.client_id;
    const clientSecret = integration.client_secret;
    
    if (!refreshToken || !clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Missing Zoho credentials" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token"
    });

    const response = await fetch(
      "https://accounts.zoho.com/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      }
    );

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error("Zoho token refresh failed:", errorResponse);
      
      return new Response(
        JSON.stringify({ error: "Failed to refresh Zoho token", details: errorResponse }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const tokenData = await response.json();
    
    // Calculate expiry time (typically 1 hour = 3600 seconds)
    const expiresIn = tokenData.expires_in || 3600;
    const expiryDate = new Date(now.getTime() + expiresIn * 1000);
    
    // Update the database with the new token
    const { error: updateError } = await supabase
      .from("zoho_integration")
      .update({
        access_token: tokenData.access_token,
        token_expires_at: expiryDate.toISOString(),
        updated_at: now.toISOString()
      })
      .eq("id", integration.id);
    
    if (updateError) {
      console.error("Error updating token:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update token in database" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        access_token: tokenData.access_token,
        organization_id: integration.organization_id,
        expires_at: expiryDate.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error in zoho-tokens function:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
    );
  }
});
