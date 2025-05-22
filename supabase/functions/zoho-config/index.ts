
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

  // Handle GET request to fetch current config
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
        JSON.stringify({ error: "Internal server error", details: err.message }),
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

      if (!clientId || !refreshToken || !organizationId) {
        console.error("Missing required fields in request body");
        return new Response(
          JSON.stringify({ error: "Client ID, Refresh Token, and Organization ID are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First check if we're just updating and need to get the existing client secret
      let finalClientSecret = clientSecret;
      if (!clientSecret) {
        console.log("No client secret provided, checking if we're updating an existing configuration");
        const { data: existingConfig } = await supabase
          .from("zoho_integration")
          .select("client_secret")
          .limit(1);
          
        if (existingConfig && existingConfig.length > 0) {
          finalClientSecret = existingConfig[0].client_secret;
          console.log("Using existing client secret");
        } else {
          return new Response(
            JSON.stringify({ error: "Client Secret is required for initial configuration" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Call make.com webhook to validate the configuration
      console.log("Calling make.com webhook to validate Zoho configuration:", makeWebhookUrl);
      const webhookResponse = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "validateConfig",
          clientId: clientId,
          clientSecret: finalClientSecret,
          refreshToken: refreshToken,
          organizationId: organizationId
        })
      });
      
      console.log(`make.com webhook validation response status: ${webhookResponse.status}`);
      
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error("Zoho configuration validation failed via make.com:", errorText);
        
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
        console.log(`make.com webhook validation response: ${responseText}`);
        validationData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse make.com webhook validation response:", e);
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
          const updateData = {
            client_id: clientId,
            refresh_token: refreshToken,
            organization_id: organizationId,
            access_token: validationData.access_token,
            token_expires_at: expiryDate.toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Only update client_secret if a new one was provided
          if (clientSecret) {
            updateData.client_secret = clientSecret;
          }
          
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
              client_id: clientId,
              client_secret: finalClientSecret,
              refresh_token: refreshToken,
              organization_id: organizationId,
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
            message: "Zoho configuration saved and verified successfully via make.com",
            id: data[0].id
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (dbError) {
        console.error("Database error:", dbError);
        return new Response(
          JSON.stringify({ error: "Database error", details: dbError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      console.error("Error in zoho-config POST:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: err.message }),
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
