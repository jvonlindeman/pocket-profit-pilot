import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://drpremiern8n.lat/webhook/dc0d2f76-3d5c-4d59-9f8c-e34a55712254";

interface N8nClientStatus {
  client_id: string;
  name: string;
  status: string;
  date: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT - get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for updates
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT is valid
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sync-client-status] User ${user.id} triggered sync`);

    // Fetch data from n8n webhook
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!webhookResponse.ok) {
      console.error(`[sync-client-status] n8n webhook error: ${webhookResponse.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch data from n8n webhook", status: webhookResponse.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse response and handle different formats
    const rawResponse = await webhookResponse.json();
    console.log(`[sync-client-status] Raw response type: ${typeof rawResponse}, isArray: ${Array.isArray(rawResponse)}`);

    // Handle both array and wrapped object formats
    let clientStatuses: N8nClientStatus[];

    if (Array.isArray(rawResponse)) {
      // Direct array format
      clientStatuses = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object') {
      // Check common wrapper properties: data, clients, items, results
      const possibleArrays = ['data', 'clients', 'items', 'results'];
      const arrayProp = possibleArrays.find(prop => Array.isArray(rawResponse[prop]));
      
      if (arrayProp) {
        clientStatuses = rawResponse[arrayProp];
        console.log(`[sync-client-status] Found array in property: ${arrayProp}`);
      } else {
        // Log the actual structure for debugging
        console.error(`[sync-client-status] Unexpected format. Keys: ${Object.keys(rawResponse).join(', ')}`);
        return new Response(
          JSON.stringify({ 
            error: "Invalid webhook response format", 
            receivedKeys: Object.keys(rawResponse),
            hint: "Expected an array or object with data/clients/items property"
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.error(`[sync-client-status] Response is not array or object: ${rawResponse}`);
      return new Response(
        JSON.stringify({ error: "Invalid webhook response", received: String(rawResponse) }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sync-client-status] Received ${clientStatuses.length} client statuses from n8n`);

    // Track results
    let updated = 0;
    let notFound = 0;
    const notFoundClients: string[] = [];

    // Update each client status in the database
    for (const client of clientStatuses) {
      const trimmedStatus = client.status.trim();
      
      const { data, error } = await supabase
        .from("retainers")
        .update({
          client_status: trimmedStatus,
          client_status_date: client.date,
        })
        .eq("n8n_id", client.client_id)
        .select("id");

      if (error) {
        console.error(`[sync-client-status] Error updating ${client.name}:`, error);
        notFound++;
        notFoundClients.push(client.name);
      } else if (!data || data.length === 0) {
        console.log(`[sync-client-status] No match for n8n_id=${client.client_id} (${client.name})`);
        notFound++;
        notFoundClients.push(client.name);
      } else {
        updated++;
      }
    }

    console.log(`[sync-client-status] Completed: ${updated} updated, ${notFound} not found`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        notFound,
        notFoundClients: notFoundClients.slice(0, 10), // Limit to first 10 for response size
        total: clientStatuses.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-client-status] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
