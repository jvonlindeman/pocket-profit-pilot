
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

interface ZohoConfigRequest {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  organizationId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET request to fetch current config
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("zoho_integration")
        .select("client_id, organization_id, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching Zoho config:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch Zoho configuration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return sanitized data (without sensitive info)
      return new Response(
        JSON.stringify({
          configured: data && data.length > 0,
          config: data && data.length > 0 ? {
            clientId: data[0].client_id,
            organizationId: data[0].organization_id,
            updatedAt: data[0].updated_at
          } : null
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Error in zoho-config GET:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Handle POST request to update config
  if (req.method === "POST") {
    try {
      // Safely handle parsing the request body
      let body;
      try {
        const text = await req.text();
        if (!text) {
          return new Response(
            JSON.stringify({ error: "Empty request body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        body = JSON.parse(text);
      } catch (parseError) {
        console.error("Error parsing request body:", parseError);
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const { clientId, clientSecret, refreshToken, organizationId } = body as ZohoConfigRequest;

      if (!clientId || !clientSecret || !refreshToken || !organizationId) {
        return new Response(
          JSON.stringify({ error: "All fields are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate the refresh token by trying to get an access token
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
        const errorText = await response.text();
        console.error("Zoho token validation failed:", errorText);
        
        return new Response(
          JSON.stringify({ error: "Invalid Zoho credentials", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = await response.json();
      
      // Calculate expiry time
      const now = new Date();
      const expiresIn = tokenData.expires_in || 3600;
      const expiryDate = new Date(now.getTime() + expiresIn * 1000);

      // Save configuration to database
      const { data, error } = await supabase
        .from("zoho_integration")
        .insert({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          organization_id: organizationId,
          access_token: tokenData.access_token,
          token_expires_at: expiryDate.toISOString()
        })
        .select();

      if (error) {
        console.error("Error saving Zoho config:", error);
        return new Response(
          JSON.stringify({ error: "Failed to save configuration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Zoho configuration saved successfully",
          id: data[0].id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Error in zoho-config POST:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Handle unsupported methods
  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
