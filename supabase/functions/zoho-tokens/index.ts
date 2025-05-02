
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

// Helper function to determine the Zoho API region from token or explicit setting
function getZohoRegion(token: string): string {
  // Force "com" as default for US accounts
  let region = "com";
  
  // Only use token-based detection as a fallback in case we need to support other regions later
  if (token.includes(".eu.")) {
    region = "eu";
  } else if (token.includes(".in.")) {
    region = "in";
  } else if (token.includes(".au.")) {
    region = "au";
  } else if (token.includes(".cn.")) {
    region = "cn";
  }
  
  console.log(`Using Zoho region: ${region} (for domain zoho.${region})`);
  return region;
}

serve(async (req: Request) => {
  console.log(`zoho-tokens function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the current integration record
    console.log("Fetching Zoho integration record");
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
      console.log("Access token is still valid, returning it");
      
      // Determine region (US accounts use "com")
      const region = getZohoRegion(integration.refresh_token);
      
      return new Response(
        JSON.stringify({ 
          access_token: integration.access_token,
          organization_id: integration.organization_id,
          expires_at: integration.token_expires_at,
          region: region
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
      console.error("Missing Zoho credentials:", {
        hasRefreshToken: !!refreshToken,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      return new Response(
        JSON.stringify({ error: "Missing Zoho credentials" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Determine region (US accounts use "com")
    const region = getZohoRegion(refreshToken);
    
    // Always use accounts.zoho.{region} for authentication
    const zohoTokenUrl = `https://accounts.zoho.${region}/oauth/v2/token`;
    
    console.log(`Using Zoho OAuth endpoint: ${zohoTokenUrl}`);

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token"
    });

    console.log("Calling Zoho OAuth API to refresh token");
    const response = await fetch(
      zohoTokenUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      }
    );

    const responseText = await response.text();
    console.log(`Zoho token response status: ${response.status}`);
    console.log(`Zoho token response headers: ${JSON.stringify([...response.headers])}`);
    console.log(`Zoho token response: ${responseText}`);
    
    if (!response.ok) {
      console.error("Zoho token refresh failed:", responseText);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to refresh Zoho token", 
          details: responseText,
          status: response.status,
          url: zohoTokenUrl 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse token response:", e);
      return new Response(
        JSON.stringify({ error: "Failed to parse token response", details: responseText }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Calculate expiry time (typically 1 hour = 3600 seconds)
    const expiresIn = tokenData.expires_in || 3600;
    const expiryDate = new Date(now.getTime() + expiresIn * 1000);
    
    // Update the database with the new token
    console.log("Updating database with new access token");
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
    
    console.log("Token refreshed successfully");
    return new Response(
      JSON.stringify({ 
        access_token: tokenData.access_token,
        organization_id: integration.organization_id,
        expires_at: expiryDate.toISOString(),
        region: region
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
