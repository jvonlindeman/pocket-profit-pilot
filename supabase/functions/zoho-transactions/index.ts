
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

// Check if cache is fresh based on how old the data is
// For current month data, use a shorter window (1 hour)
// For historical data, use a longer window (24 hours)
const isCacheFresh = (cachedData: any[], maxHoursOld = 24, requestStartDate: string = ''): boolean => {
  if (!cachedData || cachedData.length === 0) return false;
  
  const latestSync = new Date(Math.max(...cachedData.map(tx => new Date(tx.sync_date).getTime())));
  const cacheAge = Date.now() - latestSync.getTime();
  const cacheAgeHours = cacheAge / (1000 * 60 * 60);
  
  // If it's the current month, use a shorter freshness window
  const today = new Date();
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const requestMonthYear = requestStartDate.substring(0, 7); // Extract YYYY-MM from date
  
  // For current month data, use 1 hour; for historical data, use maxHoursOld (default 24 hours)
  const freshnessPeriod = (requestMonthYear === currentMonthYear) ? 1 : maxHoursOld;
  
  console.log(`Cache age: ${cacheAgeHours.toFixed(2)} hours, freshness threshold: ${freshnessPeriod} hours`);
  
  return cacheAgeHours < freshnessPeriod;
};

// Improved cache coverage check that doesn't require a transaction for every day
const cacheCoversDateRange = (cachedData: any[], startDate: string, endDate: string): boolean => {
  if (!cachedData || cachedData.length === 0) return false;
  
  // Get the earliest and latest dates in the cache
  const cachedDates = cachedData.map(tx => new Date(tx.date));
  const earliestCachedDate = new Date(Math.min(...cachedDates.map(date => date.getTime())));
  const latestCachedDate = new Date(Math.max(...cachedDates.map(date => date.getTime())));
  
  const requestStart = new Date(startDate);
  const requestEnd = new Date(endDate);
  
  // Check if the cache spans the entire requested date range
  const spansDateRange = earliestCachedDate <= requestStart && latestCachedDate >= requestEnd;
  
  // Also check if we have a reasonable sample of different transaction types
  const hasIncomeTransactions = cachedData.some(tx => tx.type === 'income');
  const hasExpenseTransactions = cachedData.some(tx => tx.type === 'expense');
  
  // For Zoho and Stripe sources
  const hasZohoTransactions = cachedData.some(tx => tx.source === 'Zoho');
  const hasStripeTransactions = cachedData.some(tx => 
    tx.source === 'Stripe' || cachedData.length > 10 // If we have many transactions, we might not need Stripe data
  );
  
  // Log coverage details for debugging
  console.log(`Cache coverage check - Range ${startDate} to ${endDate}:`, {
    spansDateRange,
    transactionCount: cachedData.length,
    hasIncomeTransactions,
    hasExpenseTransactions,
    hasZohoTransactions,
    hasStripeTransactions,
    earliestCachedDate: earliestCachedDate.toISOString().split('T')[0],
    latestCachedDate: latestCachedDate.toISOString().split('T')[0],
    requestStartDate: requestStart.toISOString().split('T')[0],
    requestEndDate: requestEnd.toISOString().split('T')[0]
  });
  
  // We consider the cache complete if it spans the date range and has representative transaction types
  const hasGoodCoverage = spansDateRange && 
    hasIncomeTransactions && 
    hasExpenseTransactions && 
    hasZohoTransactions &&
    hasStripeTransactions;
    
  return hasGoodCoverage;
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
    
    console.log("Edge function parsed dates:", { startDate, endDate, forceRefresh });
    
    if (!startDate || !endDate) {
      console.error("Missing start or end date");
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if we have cached data for this date range and don't need to refresh
    if (!forceRefresh) {
      console.log("Checking for cached transactions");
      const { data: cachedTransactions, error: cacheError } = await supabase
        .from("cached_transactions")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);
        
      if (!cacheError && cachedTransactions && cachedTransactions.length > 0) {
        // Check if the data is recent and covers the entire range
        const isFresh = isCacheFresh(cachedTransactions, 24, startDate);
        const fullCoverage = cacheCoversDateRange(cachedTransactions, startDate, endDate);
        
        if (isFresh && fullCoverage) {
          console.log("Returning fresh and complete cached transactions:", cachedTransactions.length);
          return new Response(
            JSON.stringify({
              fromCache: true,
              cached: true,
              data: cachedTransactions
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`Cache ${!isFresh ? 'is stale' : ''} ${!fullCoverage ? 'has incomplete coverage' : ''}, fetching fresh data`);
      } else {
        console.log("No cached data found or cache error:", cacheError);
      }
    } else {
      console.log("Force refresh requested, bypassing cache completely");
    }
    
    // No cached data or force refresh, fetch new data from make.com webhook
    console.log("Edge function fetching fresh data from make.com webhook");
    
    // CRITICAL: Use exactly the dates received from the client without any modifications
    // Log the exact dates that will be sent to the webhook
    console.log("Edge function sending dates to webhook:", {
      startDate,
      endDate,
      forceRefresh
    });
    
    // Call the make.com webhook
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
    console.log(`Edge function: make.com webhook raw response: ${responseText.substring(0, 500)}...`);
    
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
    
    // Process Stripe income if available
    if (webhookData.stripe) {
      try {
        const stripeAmount = parseFloat(String(webhookData.stripe).replace(".", "").replace(",", "."));
        if (!isNaN(stripeAmount) && stripeAmount > 0) {
          const stripeTransaction = {
            date: new Date().toISOString().split('T')[0],
            amount: stripeAmount,
            description: 'Ingresos de Stripe',
            category: 'Ingresos por plataforma',
            source: 'Stripe',
            type: 'income'
          };
          
          const externalId = `stripe-income-${stripeTransaction.date}-${stripeTransaction.amount}`;
          const id = generateConsistentId(
            { ...stripeTransaction, external_id: externalId }, 
            0
          );
          
          transactions.push({
            ...stripeTransaction,
            id,
            external_id: externalId
          } as Transaction);
        }
      } catch (e) {
        console.error("Error processing Stripe income:", e);
      }
    }
    
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
    
    console.log(`Processed ${transactions.length} transactions for date range ${startDate} to ${endDate}`);
    
    // IMPROVED CACHING STRATEGY
    if (transactions.length > 0) {
      try {
        console.log(`Caching ${transactions.length} transactions for date range ${startDate} to ${endDate}`);
        
        // Create an array with transactions enriched with sync_date
        const transactionsWithSyncDate = transactions.map(tx => ({
          ...tx,
          sync_date: new Date().toISOString()
        }));
        
        // FIRST: Delete ALL existing transactions for the requested date range
        // This fixes the issue where transactions might not be updated when date range changes
        console.log(`Clearing all existing transactions in date range ${startDate} to ${endDate} before inserting new ones`);
        
        const { error: deleteRangeError } = await supabase
          .from("cached_transactions")
          .delete()
          .gte("date", startDate)
          .lte("date", endDate);
        
        if (deleteRangeError) {
          console.error("Error clearing transactions in date range:", deleteRangeError);
          // Continue with insert even if delete fails
        }
        
        // Now insert all new transactions
        console.log(`Inserting ${transactionsWithSyncDate.length} transactions into cache`);
        
        // Break into smaller batches to avoid any size limitations
        const batchSize = 50;
        const batches = [];
        
        for (let i = 0; i < transactionsWithSyncDate.length; i += batchSize) {
          batches.push(transactionsWithSyncDate.slice(i, i + batchSize));
        }
        
        console.log(`Split into ${batches.length} batches for insertion`);
        
        // Process each batch
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          console.log(`Inserting batch ${i + 1} of ${batches.length} with ${batch.length} transactions`);
          
          const { error: insertError } = await supabase
            .from("cached_transactions")
            .insert(batch);
          
          if (insertError) {
            console.error(`Error inserting batch ${i + 1}:`, insertError);
          } else {
            console.log(`Successfully inserted batch ${i + 1}`);
          }
        }
        
        console.log(`Cache update completed for date range ${startDate} to ${endDate}`);
      } catch (dbError) {
        console.error(`Database error when storing transactions for range ${startDate} to ${endDate}:`, dbError);
      }
    }
    
    // Add the original response to the data for debugging
    const responseData = {
      ...webhookData,
      raw_response: originalResponse.substring(0, 1000) + (originalResponse.length > 1000 ? '...[truncated]' : ''),
      cached_transactions: transactions,
      fromCache: false,
      cached: false
    };
    
    console.log(`Successfully fetched and processed data for range ${startDate} to ${endDate}`);
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

