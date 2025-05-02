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

    // Call the make.com webhook to refresh the token
    console.log("Calling make.com webhook for token refresh:", makeWebhookUrl);
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
      console.log(`make.com webhook token response: ${responseText}`);
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
      console.error("Invalid token data from make.com webhook:", tokenData);
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
