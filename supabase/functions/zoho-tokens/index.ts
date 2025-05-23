
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers with restricted origin
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*", // Preferably set to specific origin
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Get make.com webhook URL from environment variable
const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL") as string;

if (!makeWebhookUrl) {
  console.error("MAKE_WEBHOOK_URL environment variable is not set");
}

serve(async (req: Request) => {
  console.log(`zoho-tokens function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle POST requests for code exchange or custom actions
    if (req.method === "POST") {
      const requestBody = await req.json();
      
      // Input validation
      if (!requestBody || typeof requestBody !== 'object') {
        return new Response(
          JSON.stringify({ error: "Invalid request format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Handle code exchange action
      if (requestBody.action === "exchange-code" && requestBody.code) {
        console.log("Exchanging authorization code for tokens");
        
        // Validate code parameter
        if (typeof requestBody.code !== 'string' || requestBody.code.length < 5) {
          return new Response(
            JSON.stringify({ error: "Invalid authorization code format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        try {
          // Get the client configuration from database
          const { data: configData, error: configError } = await supabase
            .from("zoho_integration")
            .select("client_id, client_secret")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
          if (configError || !configData) {
            console.error("Error fetching Zoho client configuration:", configError);
            return new Response(
              JSON.stringify({ error: "Zoho client configuration not found" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // Call make.com webhook to exchange the code for tokens
          if (!makeWebhookUrl) {
            throw new Error("Make webhook URL is not configured");
          }
          
          const exchangeResponse = await fetch(makeWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "exchangeCode",
              code: requestBody.code,
              clientId: configData.client_id,
              clientSecret: configData.client_secret
            })
          });
          
          if (!exchangeResponse.ok) {
            const errorText = await exchangeResponse.text();
            throw new Error(`Code exchange failed: ${errorText}`);
          }
          
          const tokenData = await exchangeResponse.json();
          
          if (!tokenData.refresh_token) {
            throw new Error("No refresh token received from code exchange");
          }
          
          // Return the refresh token to the client
          return new Response(
            JSON.stringify({ refresh_token: tokenData.refresh_token, organization_id: tokenData.organization_id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error("Error exchanging code:", err);
          return new Response(
            JSON.stringify({ error: "Failed to exchange code for tokens", details: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Invalid action
      return new Response(
        JSON.stringify({ error: "Invalid action specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
      
      return new Response(
        JSON.stringify({ 
          access_token: integration.access_token,
          organization_id: integration.organization_id,
          expires_at: integration.token_expires_at,
          region: "com" // Always use "com" for US accounts
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Otherwise, request a token refresh through make.com webhook
    console.log("Token expired, requesting refresh through make.com webhook");
    
    const refreshToken = integration.refresh_token;
    const clientId = integration.client_id;
    const clientSecret = integration.client_secret;
    const organizationId = integration.organization_id;
    
    if (!refreshToken || !clientId || !organizationId) {
      console.error("Missing Zoho credentials:", {
        hasRefreshToken: !!refreshToken,
        hasClientId: !!clientId,
        hasOrganizationId: !!organizationId
      });
      return new Response(
        JSON.stringify({ error: "Missing Zoho credentials" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Make sure webhook URL is available
    if (!makeWebhookUrl) {
      console.error("Make webhook URL is not configured");
      return new Response(
        JSON.stringify({ error: "Make webhook URL is not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Call the make.com webhook to refresh the token
    console.log("Calling make.com webhook for token refresh");
    const webhookResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "refreshToken",
        refreshToken: refreshToken,
        clientId: clientId,
        clientSecret: clientSecret,
        organizationId: organizationId
      })
    });
    
    console.log(`make.com webhook response status: ${webhookResponse.status}`);
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Token refresh through make.com webhook failed:", errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to refresh Zoho token through make.com", 
          details: errorText
        }),
        { 
          status: webhookResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse the webhook response
    let tokenData;
    try {
      const responseText = await webhookResponse.text();
      console.log(`make.com webhook token response received`);
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse make.com webhook token response:", e);
      return new Response(
        JSON.stringify({ error: "Failed to parse token response" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!tokenData.access_token) {
      console.error("Invalid token data from make.com webhook");
      return new Response(
        JSON.stringify({ error: "Invalid token data from make.com webhook" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Calculate expiry time (from token data or default to 1 hour)
    const expiresIn = tokenData.expires_in || 3600;
    const expiryDate = new Date(now.getTime() + expiresIn * 1000);
    
    // Update the database with the new token
    console.log("Updating database with new access token from make.com webhook");
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
    
    console.log("Token refreshed successfully via make.com webhook");
    return new Response(
      JSON.stringify({ 
        access_token: tokenData.access_token,
        organization_id: integration.organization_id,
        expires_at: expiryDate.toISOString(),
        region: "com" // Always use "com" for US accounts
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
