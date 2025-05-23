
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

interface ZohoConfigRequest {
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
  organizationId: string;
}

serve(async (req: Request) => {
  console.log(`zoho-config function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET request to fetch current config (sanitized)
  if (req.method === "GET") {
    try {
      console.log("Processing GET request to fetch Zoho configuration");
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
      console.log("Zoho config fetched successfully:", data && data.length > 0);
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
        JSON.stringify({ error: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Handle POST request to update config
  if (req.method === "POST") {
    try {
      console.log("Processing POST request to update Zoho configuration");
      // Safely handle parsing the request body
      let body: ZohoConfigRequest;
      try {
        const text = await req.text();
        if (!text) {
          console.error("Empty POST request body");
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
      
      const { clientId, clientSecret, refreshToken, organizationId } = body;

      // Input validation
      if (!refreshToken) {
        console.error("Missing required refreshToken in request body");
        return new Response(
          JSON.stringify({ error: "Refresh Token is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Additional validation for refreshToken format
      if (typeof refreshToken !== 'string' || refreshToken.length < 10) {
        return new Response(
          JSON.stringify({ error: "Invalid refresh token format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First check if we're just updating and need to get existing data
      let finalClientId = clientId;
      let finalClientSecret = clientSecret;
      let finalOrganizationId = organizationId;
      
      if (!clientId || !organizationId || !clientSecret) {
        console.log("Missing some fields, checking if we're updating an existing configuration");
        const { data: existingConfig } = await supabase
          .from("zoho_integration")
          .select("client_id, client_secret, organization_id")
          .limit(1);
          
        if (existingConfig && existingConfig.length > 0) {
          finalClientId = clientId || existingConfig[0].client_id;
          finalClientSecret = clientSecret || existingConfig[0].client_secret;
          finalOrganizationId = organizationId || existingConfig[0].organization_id;
          console.log("Using existing configuration values for missing fields");
        } else if (!clientId || !clientSecret || !organizationId) {
          return new Response(
            JSON.stringify({ error: "Missing required fields for initial configuration" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Make sure webhook URL is available
      if (!makeWebhookUrl) {
        console.error("Make webhook URL is not configured");
        return new Response(
          JSON.stringify({ error: "Integration service is not properly configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Call make.com webhook to validate the configuration
      console.log("Calling service to validate Zoho configuration");
      const webhookResponse = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "validateConfig",
          clientId: finalClientId,
          clientSecret: finalClientSecret,
          refreshToken: refreshToken,
          organizationId: finalOrganizationId
        })
      });
      
      console.log(`Validation service response status: ${webhookResponse.status}`);
      
      if (!webhookResponse.ok) {
        let errorText = "Unknown error";
        try {
          errorText = await webhookResponse.text();
        } catch (e) {
          console.error("Error getting webhook response text:", e);
        }
        
        console.error("Zoho configuration validation failed:", errorText);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to validate Zoho configuration", 
            details: errorText
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse the webhook validation response
      let validationData;
      try {
        const responseText = await webhookResponse.text();
        console.log("Validation response received");
        validationData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse validation response:", e);
        return new Response(
          JSON.stringify({ error: "Failed to parse validation response" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (!validationData.success) {
        console.error("Validation failed:", validationData);
        return new Response(
          JSON.stringify({ 
            error: validationData.error || "Validation failed", 
            details: validationData.details || "Unknown error during validation"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Everything is validated, now save to the database
      try {
        // Calculate token expiry from the validation data
        const now = new Date();
        const expiresIn = validationData.expires_in || 3600;
        const expiryDate = new Date(now.getTime() + expiresIn * 1000);

        // First try to update existing config if it exists
        console.log("Checking for existing Zoho configuration");
        const { data: existingConfig } = await supabase
          .from("zoho_integration")
          .select("id")
          .limit(1);

        let result;
        if (existingConfig && existingConfig.length > 0) {
          // Update existing configuration
          console.log("Updating existing Zoho configuration");
          const updateData: Record<string, any> = {
            refresh_token: refreshToken,
            access_token: validationData.access_token,
            token_expires_at: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Only add these fields if they're provided
          if (finalClientId) updateData.client_id = finalClientId;
          if (finalClientSecret) updateData.client_secret = finalClientSecret;
          if (finalOrganizationId) updateData.organization_id = finalOrganizationId;
          
          result = await supabase
            .from("zoho_integration")
            .update(updateData)
            .eq("id", existingConfig[0].id)
            .select();
        } else {
          // Insert new configuration
          console.log("Creating new Zoho configuration");
          result = await supabase
            .from("zoho_integration")
            .insert({
              client_id: finalClientId,
              client_secret: finalClientSecret,
              refresh_token: refreshToken,
              organization_id: finalOrganizationId,
              access_token: validationData.access_token,
              token_expires_at: expiryDate.toISOString()
            })
            .select();
        }

        const { data, error } = result;

        if (error) {
          console.error("Error saving Zoho config:", error);
          return new Response(
            JSON.stringify({ error: "Failed to save configuration", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Zoho configuration saved successfully");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Zoho configuration saved and verified successfully",
            id: data[0].id
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (dbError) {
        console.error("Database error:", dbError);
        return new Response(
          JSON.stringify({ error: "Database error", details: dbError instanceof Error ? dbError.message : "Unknown error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      console.error("Error in zoho-config POST:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Handle unsupported methods
  console.error(`Unsupported HTTP method: ${req.method}`);
  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
