
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

interface TransactionRequest {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}

interface Transaction {
  id: string;
  external_id: string;
  date: string;
  amount: number;
  description: string | null;
  category: string;
  source: string;
  type: string;
}

// Generate a consistent ID for a transaction based on its properties
const generateConsistentId = (transaction: Partial<Transaction>, index: number): string => {
  const source = transaction.source || 'unknown';
  const type = transaction.type || 'unknown';
  const date = transaction.date || new Date().toISOString().split('T')[0];
  const identifier = transaction.external_id || 
                    `${transaction.customer_name || transaction.vendor_name || 'unknown'}-${transaction.amount || 0}`;
  
  return `${source.toLowerCase()}-${type.toLowerCase()}-${date}-${identifier}`;
};

serve(async (req: Request) => {
  console.log(`zoho-transactions function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the request body
    let requestBody: TransactionRequest;
    
    try {
      const text = await req.text();
      if (!text) {
        console.error("Empty request body");
        return new Response(
          JSON.stringify({ error: "Empty request body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      requestBody = JSON.parse(text);
      console.log("Edge function received request body:", requestBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    const { startDate, endDate, forceRefresh = false } = requestBody;
    
    console.log("Edge function parsed dates:", { startDate, endDate });
    
    if (!startDate || !endDate) {
      console.error("Missing start or end date");
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Call the make.com webhook directly
    console.log("Edge function calling make.com webhook:", makeWebhookUrl);
    const webhookResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDate,
        endDate: endDate,
        forceRefresh: forceRefresh
      })
    });
    
    console.log(`Edge function: make.com webhook response status: ${webhookResponse.status}`);
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Failed to fetch data from make.com webhook:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch data from make.com webhook", 
          details: errorText,
          raw_response: errorText
        }),
        { status: webhookResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the raw response text
    const responseText = await webhookResponse.text();
    console.log(`Edge function: make.com webhook raw response: ${responseText}`);
    
    // Parse the webhook response
    let webhookData;
    let originalResponse = responseText;
    
    try {
      // First try direct parsing
      webhookData = JSON.parse(responseText);
      console.log("Successfully parsed JSON directly");
    } catch (parseError) {
      console.log("Initial JSON parse failed, attempting to fix format");
      
      try {
        // Create a properly formatted JSON structure
        let fixedJson = responseText.trim();
        
        // Handle the case where the response is a string that needs to be parsed
        if (fixedJson.startsWith('"') && fixedJson.endsWith('"')) {
          try {
            // It might be a JSON string inside a string, try to parse the inner string
            const unescapedJson = JSON.parse(fixedJson);
            if (typeof unescapedJson === 'string') {
              console.log("Detected JSON string inside string, attempting to parse inner content");
              fixedJson = unescapedJson;
            }
          } catch (e) {
            console.error("Error unescaping JSON string:", e);
          }
        }
        
        // Handle specific fields that might be strings instead of arrays
        const arrayFields = ["colaboradores", "expenses", "payments"];
        for (const field of arrayFields) {
          if (fixedJson.includes(`"${field}": "`)) {
            fixedJson = fixedJson.replace(
              new RegExp(`"${field}": "([^"]*)"`, 'g'), 
              (match, captured) => {
                try {
                  // Convert the string into a proper array by extracting objects
                  const items = captured.match(/\{"key":\d+,"value":\{[^}]+\}\}/g) || [];
                  const properArray = items.map(item => {
                    // Need to handle escaped quotes in the string
                    const cleanedItem = item.replace(/\\"/g, '"');
                    try {
                      const parsed = JSON.parse(cleanedItem);
                      return parsed.value;
                    } catch (e) {
                      console.error(`Error parsing ${field} item:`, cleanedItem, e);
                      return null;
                    }
                  }).filter(Boolean);
                  return `"${field}": ${JSON.stringify(properArray)}`;
                } catch (e) {
                  console.error(`Error converting ${field} to array:`, e);
                  return `"${field}": []`;
                }
              }
            );
          }
        }
        
        // Try to parse the fixed JSON
        try {
          webhookData = JSON.parse(fixedJson);
          console.log("Successfully parsed fixed JSON");
        } catch (secondParseError) {
          console.error("Failed to parse fixed JSON:", secondParseError);
          
          // As a fallback, return a structured response with the raw text
          return new Response(
            JSON.stringify({ 
              raw_response: originalResponse,
              error: "Could not parse webhook response",
              details: "The response from make.com could not be parsed as valid JSON."
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (fixError) {
        console.error("Error during fix attempt:", fixError);
        
        // As a fallback, return a structured response with the raw text
        return new Response(
          JSON.stringify({ 
            raw_response: originalResponse,
            error: "Could not process webhook response",
            details: fixError instanceof Error ? fixError.message : "Unknown error"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Process the data into transactions
    const transactions: Transaction[] = [];
    
    // IMPORTANT: We no longer process Stripe income from make.com
    // Stripe data now comes directly from the Stripe API via the stripe-balance edge function
    // This comment is kept for clarity on the change made
    console.log("No longer processing Stripe data from make.com webhook");
    
    // Process collaborator expenses - Ahora incluyendo fechas
    if (Array.isArray(webhookData.colaboradores)) {
      webhookData.colaboradores.forEach((item: any, index: number) => {
        if (item && typeof item.total !== 'undefined' && item.vendor_name) {
          const amount = Number(item.total);
          if (amount > 0) {
            // Usar la fecha del colaborador si está disponible, o la fecha actual
            const collaboratorDate = item.date || new Date().toISOString().split('T')[0];
            
            const collaboratorTransaction = {
              date: collaboratorDate,
              amount,
              description: `Pago a colaborador: ${item.vendor_name}`,
              category: 'Pagos a colaboradores',
              source: 'Zoho',
              type: 'expense'
            };
            
            const externalId = `colaborador-${item.vendor_name.replace(/\s/g, '-')}-${collaboratorDate}-${amount}`;
            const id = generateConsistentId(
              { ...collaboratorTransaction, external_id: externalId },
              index
            );
            
            transactions.push({
              ...collaboratorTransaction,
              id,
              external_id: externalId
            } as Transaction);
          }
        }
      });
    }
    
    // Process regular expenses (ignoring "Impuestos" category)
    if (Array.isArray(webhookData.expenses)) {
      webhookData.expenses.forEach((item: any, index: number) => {
        if (item && typeof item.total !== 'undefined' && item.account_name !== "Impuestos") {
          const amount = Number(item.total);
          if (amount > 0) {
            const expenseDate = item.date || new Date().toISOString().split('T')[0];
            const vendorName = item.vendor_name || '';
            const accountName = item.account_name || 'Gastos generales';
            
            const expenseTransaction = {
              date: expenseDate,
              amount,
              description: vendorName 
                ? `Pago a ${vendorName}` 
                : `${accountName}`,
              category: accountName,
              source: 'Zoho',
              type: 'expense'
            };
            
            const externalId = `expense-${(vendorName || accountName || '').replace(/\s/g, '-')}-${expenseDate}-${amount}`;
            const id = generateConsistentId(
              { ...expenseTransaction, external_id: externalId },
              index
            );
            
            transactions.push({
              ...expenseTransaction,
              id,
              external_id: externalId
            } as Transaction);
          }
        }
      });
    }
    
    // Process payments (income)
    if (Array.isArray(webhookData.payments)) {
      webhookData.payments.forEach((item: any, index: number) => {
        if (item && typeof item.amount !== 'undefined' && item.customer_name) {
          const amount = Number(item.amount);
          if (amount > 0) {
            const paymentDate = item.date || new Date().toISOString().split('T')[0];
            const customerName = item.customer_name;
            const invoiceId = item.invoice_id || '';
            
            const incomeTransaction = {
              date: paymentDate,
              amount,
              description: `Ingreso de ${customerName}`,
              category: 'Ingresos',
              source: 'Zoho',
              type: 'income'
            };
            
            const externalId = `income-${customerName.replace(/\s/g, '-')}-${paymentDate}-${invoiceId || index}`;
            const id = generateConsistentId(
              { ...incomeTransaction, external_id: externalId },
              index
            );
            
            transactions.push({
              ...incomeTransaction,
              id,
              external_id: externalId
            } as Transaction);
          }
        }
      });
    }
    
    console.log(`Processed ${transactions.length} transactions`);
    
    // Add the original response to the data for debugging
    const responseData = {
      ...webhookData,
      raw_response: originalResponse,
      cached_transactions: transactions,
    };
    
    console.log("Successfully fetched and processed data");
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Error in zoho-transactions function:", err);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: err instanceof Error ? err.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
