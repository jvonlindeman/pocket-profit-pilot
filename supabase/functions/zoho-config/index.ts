
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

// Helper function to determine the Zoho API region from token or explicit setting
function getZohoRegion(token: string): string {
  // Force "com" as default for US accounts
  let region = "com";
  
  // Only use token-based detection as a fallback
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
      let body;
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
      
      const { clientId, clientSecret, refreshToken, organizationId } = body as ZohoConfigRequest;

      if (!clientId || !refreshToken || !organizationId) {
        console.error("Missing required fields in request body");
        return new Response(
          JSON.stringify({ error: "Client ID, Refresh Token, and Organization ID are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Determine region (US accounts use "com")
      const region = getZohoRegion(refreshToken);
      
      // Use the accounts.zoho.{region} for authentication
      const tokenUrl = `https://accounts.zoho.${region}/oauth/v2/token`;

      // Validate the refresh token by trying to get an access token
      const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret || "", // Allow empty when updating
        grant_type: "refresh_token"
      });

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
          
          // Update the params
          params.set("client_secret", finalClientSecret);
        } else {
          return new Response(
            JSON.stringify({ error: "Client Secret is required for initial configuration" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.log("Validating Zoho credentials with refresh token at:", tokenUrl);
      const response = await fetch(
        tokenUrl,
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
      console.log(`Zoho token response: ${responseText}`);

      if (!response.ok) {
        let errorMessage = "Invalid Zoho credentials";
        
        // Try to provide more helpful error messages
        if (responseText.includes("invalid_client")) {
          errorMessage = "Invalid Client ID or Client Secret";
        } else if (responseText.includes("invalid_grant")) {
          errorMessage = "Invalid Refresh Token. Ensure it has the ZohoBooks.fullaccess.all scope";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please verify your credentials";
        }
        
        console.error("Zoho token validation failed:", errorText);
        
        return new Response(
          JSON.stringify({ error: errorMessage, details: responseText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = await response.json();

      // Calculate expiry time
      const now = new Date();
      const expiresIn = tokenData.expires_in || 3600;
      const expiryDate = new Date(now.getTime() + expiresIn * 1000);

      try {
        // Now let's verify we can actually access Zoho Books with this token
        // by making a simple API call to list organizations or another light endpoint
        const verifyUrl = `https://books.zohoapis.${region}/api/v3/organizations`;
        
        console.log("Verifying Zoho Books API access with:", verifyUrl);
        const verifyResponse = await fetch(
          verifyUrl,
          {
            headers: {
              "Authorization": `Zoho-oauthtoken ${tokenData.access_token}`,
              "Content-Type": "application/json"
            }
          }
        );
        
        const verifyText = await verifyResponse.text();
        console.log(`Zoho Books API verify response status: ${verifyResponse.status}`);
        console.log(`Zoho Books API verify response: ${verifyText}`);
        
        if (!verifyResponse.ok) {
          let apiErrorMessage = "Could not access Zoho Books API";
          
          if (verifyText.includes("invalid_token")) {
            apiErrorMessage = "API token is invalid or has incorrect permissions";
          } else if (verifyText.includes("invalid_organization")) {
            apiErrorMessage = "Invalid Organization ID";
          }
          
          return new Response(
            JSON.stringify({ 
              error: apiErrorMessage, 
              details: verifyText,
              note: "Authentication successful but API access failed. Check organization ID and API permissions."
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

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
            access_token: tokenData.access_token,
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
              access_token: tokenData.access_token,
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
      } catch (apiError: any) {
        console.error("Error verifying Zoho Books API access:", apiError);
        return new Response(
          JSON.stringify({ 
            error: "Error verifying Zoho Books API access", 
            details: apiError.message,
            note: "Authentication successful but failed to verify API access"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (err: any) {
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
