
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests - using environment variable for origin
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// The make.com webhook URL from environment variable
const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL") as string;

if (!makeWebhookUrl) {
  console.error("MAKE_WEBHOOK_URL environment variable is not set");
}

// Lista de proveedores que deben ser excluidos
// Updated to use the API config file
const excludedVendors = ["Johan von Lindeman", "DFC Panama", "Bottom Consulting", "Mr. Analytics LLC"];

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

/**
 * Check if data for a given date range is already in cache
 */
async function checkCache(source: string, startDate: string, endDate: string): Promise<{
  cached: boolean;
  data?: Transaction[];
  partial: boolean;
}> {
  try {
    // Call the RPC function to check if date range is cached
    const { data: cacheCheck, error: cacheError } = await supabase.rpc(
      'is_date_range_cached',
      { p_source: source, p_start_date: startDate, p_end_date: endDate }
    );
    
    if (cacheError || !cacheCheck || cacheCheck.length === 0) {
      console.log(`Cache check failed or returned no data: ${cacheError?.message || 'No data'}`);
      return { cached: false, partial: false };
    }
    
    const { is_cached, is_partial } = cacheCheck[0];
    
    console.log(`Cache check result for ${source} from ${startDate} to ${endDate}: Cached: ${is_cached}, Partial: ${is_partial}`);
    
    // If not cached, return early
    if (!is_cached) {
      return { cached: false, partial: is_partial };
    }
    
    // If cached, fetch the transactions from cache
    const { data: transactions, error: txError } = await supabase
      .from('cached_transactions')
      .select('*')
      .eq('source', source)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (txError) {
      console.error(`Error fetching cached transactions: ${txError.message}`);
      return { cached: false, partial: is_partial };
    }
    
    if (!transactions || transactions.length === 0) {
      console.log(`Cache indicated data exists but no transactions found for ${source} from ${startDate} to ${endDate}`);
      return { cached: false, partial: is_partial };
    }
    
    console.log(`Successfully retrieved ${transactions.length} cached transactions for ${source} from ${startDate} to ${endDate}`);
    return { cached: true, data: transactions as Transaction[], partial: is_partial };
  } catch (err) {
    console.error(`Error checking cache: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { cached: false, partial: false };
  }
}

/**
 * Store transactions directly in the Supabase database
 */
async function storeTransactionsInCache(transactions: Transaction[], source: string, startDate: string, endDate: string): Promise<boolean> {
  if (!transactions || transactions.length === 0) {
    console.log("No transactions to cache");
    return false;
  }

  console.log(`Storing ${transactions.length} ${source} transactions in cache from ${startDate} to ${endDate}`);

  try {
    // Create a cache segment record
    const { error: segmentError } = await supabase
      .from('cache_segments')
      .upsert({
        source,
        start_date: startDate,
        end_date: endDate,
        transaction_count: transactions.length,
        last_refreshed_at: new Date().toISOString(),
        status: 'processing'
      }, { onConflict: 'source, start_date, end_date' });
    
    if (segmentError) {
      console.error("Error creating cache segment:", segmentError);
      return false;
    }

    // Store transactions in batches
    const BATCH_SIZE = 50;
    let successCount = 0;
    let errorCount = 0;

    // Format transactions for database
    const cacheTransactions = transactions.map(tx => ({
      external_id: tx.id,
      date: tx.date,
      amount: tx.amount,
      description: tx.description || null,
      category: tx.category || null,
      source: tx.source,
      type: tx.type,
      fetched_at: new Date().toISOString()
    }));

    // Store transactions in batches
    for (let i = 0; i < cacheTransactions.length; i += BATCH_SIZE) {
      const batch = cacheTransactions.slice(i, i + BATCH_SIZE);
      const { error: txError } = await supabase
        .from('cached_transactions')
        .upsert(batch, { onConflict: 'external_id' });
      
      if (txError) {
        console.error(`Error storing transaction batch ${i}-${i+batch.length}:`, txError);
        errorCount++;
      } else {
        successCount++;
        console.log(`Successfully stored transaction batch ${i}-${i+batch.length}`);
      }
    }

    // Update segment status to complete if all successful
    if (errorCount === 0) {
      const { error: finalSegmentError } = await supabase
        .from('cache_segments')
        .upsert({
          source,
          start_date: startDate,
          end_date: endDate,
          transaction_count: transactions.length,
          last_refreshed_at: new Date().toISOString(),
          status: 'complete'
        }, { onConflict: 'source, start_date, end_date' });
      
      if (finalSegmentError) {
        console.error("Error updating cache segment status:", finalSegmentError);
      }
    }

    // Verify storage
    const { count, error: countError } = await supabase
      .from('cached_transactions')
      .select('*', { count: 'exact' })
      .eq('source', source)
      .gte('date', startDate)
      .lte('date', endDate);

    if (countError) {
      console.error("Error verifying transaction storage:", countError);
    } else {
      console.log(`Verified ${count} transactions in cache after storage`);
      
      if (count && count < transactions.length * 0.9) {
        console.warn(`Potentially incomplete storage. Expected ~${transactions.length}, found ${count}`);
        return false;
      }
    }

    return errorCount === 0;
  } catch (err) {
    console.error("Error storing transactions in cache:", err);
    return false;
  }
}

serve(async (req: Request) => {
  console.log(`zoho-transactions function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Verify authorization 
    const authHeader = req.headers.get('Authorization');
    const apikey = req.headers.get('apikey');
    
    // Skip auth check if this is deployed with JWT verification enabled in config.toml
    
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
    
    // Validate the input
    const { startDate, endDate, forceRefresh = false } = requestBody;
    
    if (!startDate || !endDate) {
      console.error("Missing start or end date");
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Edge function parsed dates:", { startDate, endDate, forceRefresh });

    // Check if data is already in cache and we're not forcing a refresh
    if (!forceRefresh) {
      console.log("Checking cache for Zoho transactions");
      const cacheResult = await checkCache('Zoho', startDate, endDate);

      // If we have complete cached data, return it immediately
      if (cacheResult.cached && cacheResult.data) {
        console.log(`Using ${cacheResult.data.length} cached transactions instead of calling webhook`);
        
        // Format response to match expected structure
        const responseData = {
          colaboradores: [],  // Empty placeholders since we're using cached data
          expenses: [],
          payments: [],
          cached: true,
          cached_transactions: cacheResult.data,
          cache_hit: true
        };
        
        return new Response(
          JSON.stringify(responseData),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("No complete cache hit found, proceeding to call webhook");
    } else {
      console.log("Force refresh requested, skipping cache check");
    }
    
    // Call the make.com webhook directly
    if (!makeWebhookUrl) {
      return new Response(
        JSON.stringify({ 
          error: "Make webhook URL is not configured",
          details: "The MAKE_WEBHOOK_URL environment variable is not set in the Supabase function configuration"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Edge function calling make.com webhook");
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
          raw_response: errorText,
          webhook_url_configured: !!makeWebhookUrl,
          webhook_status: webhookResponse.status
        }),
        { status: webhookResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the raw response text
    const responseText = await webhookResponse.text();
    console.log(`Edge function: make.com webhook raw response received`);
    
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
              raw_response: responseText,
              error: "Could not parse webhook response",
              details: "The response from make.com could not be parsed as valid JSON.",
              webhook_url_configured: !!makeWebhookUrl,
              webhook_status: webhookResponse.status
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (fixError) {
        console.error("Error during fix attempt:", fixError);
        
        // As a fallback, return a structured response with the raw text
        return new Response(
          JSON.stringify({ 
            raw_response: responseText,
            error: "Could not process webhook response",
            details: fixError instanceof Error ? fixError.message : "Unknown error",
            webhook_url_configured: !!makeWebhookUrl,
            webhook_status: webhookResponse.status
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Check if we have empty data
    const hasData = (
      (Array.isArray(webhookData.colaboradores) && webhookData.colaboradores.length > 0) ||
      (Array.isArray(webhookData.expenses) && webhookData.expenses.length > 0) ||
      (Array.isArray(webhookData.payments) && webhookData.payments.length > 0)
    );
    
    if (!hasData) {
      console.warn("Webhook returned empty data arrays");
      webhookData.warning = "The webhook returned empty data arrays. This could indicate no data for the period or an issue with the Make.com scenario.";
    }
    
    // Process the data into transactions
    const transactions: Transaction[] = [];
    
    // IMPORTANT: We no longer process Stripe income from make.com
    // Stripe data now comes directly from the Stripe API via the stripe-balance edge function
    // This comment is kept for clarity on the change made
    console.log("No longer processing Stripe data from make.com webhook");
    
    // Process collaborator expenses - Ahora incluyendo fechas y excluyendo proveedores específicos
    if (Array.isArray(webhookData.colaboradores)) {
      console.log(`Processing ${webhookData.colaboradores.length} collaborator records`);
      webhookData.colaboradores.forEach((item: any, index: number) => {
        if (item && typeof item.total !== 'undefined' && item.vendor_name) {
          // Excluir proveedores especificados
          if (excludedVendors.includes(item.vendor_name)) {
            console.log(`Skipping excluded vendor: ${item.vendor_name}`);
            return; // Saltar este colaborador
          }
          
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
    } else {
      console.log("No collaborator data found in webhook response");
    }
    
    // Process regular expenses (ignoring "Impuestos" category)
    if (Array.isArray(webhookData.expenses)) {
      console.log(`Processing ${webhookData.expenses.length} expense records`);
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
    } else {
      console.log("No expense data found in webhook response");
    }
    
    // Process payments (income)
    if (Array.isArray(webhookData.payments)) {
      console.log(`Processing ${webhookData.payments.length} payment records`);
      webhookData.payments.forEach((item: any, index: number) => {
        if (item && typeof item.amount !== 'undefined') {
          const amount = Number(item.amount);
          if (amount > 0) {
            const paymentDate = item.date || new Date().toISOString().split('T')[0];
            const customerName = item.customer_name || 'Cliente';
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
    } else {
      console.log("No payment data found in webhook response");
    }
    
    console.log(`Processed ${transactions.length} transactions from webhook data`);
    
    // Store the transactions in cache directly from the edge function
    let cacheResult = false;
    if (transactions.length > 0) {
      console.log(`Storing ${transactions.length} transactions in cache`);
      cacheResult = await storeTransactionsInCache(transactions, 'Zoho', startDate, endDate);
      console.log(`Transaction caching result: ${cacheResult ? 'Success' : 'Failed'}`);
    }
    
    // Add the original response to the data for debugging
    const responseData = {
      ...webhookData,
      cached_transactions: transactions,
      cache_result: cacheResult,
      transaction_count: transactions.length,
      income_count: transactions.filter(tx => tx.type === 'income').length,
      expense_count: transactions.filter(tx => tx.type === 'expense').length
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
        details: err instanceof Error ? err.message : "Unknown error",
        webhook_url_configured: !!makeWebhookUrl
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
