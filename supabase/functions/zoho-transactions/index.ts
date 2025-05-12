
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    const { startDate, endDate } = requestBody;
    
    console.log("Edge function parsed dates:", { startDate, endDate });
    
    if (!startDate || !endDate) {
      console.error("Missing start or end date");
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Call the make.com webhook - Direct fetch only, no caching
    console.log("Edge function fetching data from make.com webhook");
    
    // Log the exact dates that will be sent to the webhook
    console.log("Edge function sending dates to webhook:", {
      startDate,
      endDate,
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
        forceRefresh: true // Always force refresh since we're not caching
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
    
    // Process collaborator expenses - including dates
    if (Array.isArray(webhookData.colaboradores)) {
      console.log(`Processing ${webhookData.colaboradores.length} collaborator records`);
      
      webhookData.colaboradores.forEach((item: any, index: number) => {
        if (item && typeof item.total !== 'undefined' && item.vendor_name) {
          const amount = Number(item.total);
          if (amount > 0) {
            console.log(`Processing collaborator: ${item.vendor_name}, amount: ${amount}`);
            
            // Use collaborator date if available, or current date
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
      
      console.log(`Added ${transactions.filter(tx => tx.category === 'Pagos a colaboradores').length} collaborator transactions`);
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
      
      console.log(`Added ${transactions.filter(tx => tx.type === 'expense' && tx.category !== 'Pagos a colaboradores').length} regular expense transactions`);
    }
    
    // Process payments (income)
    if (Array.isArray(webhookData.payments)) {
      console.log(`Processing ${webhookData.payments.length} payment records`);
      
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
      
      console.log(`Added ${transactions.filter(tx => tx.type === 'income' && tx.source !== 'Stripe').length} income transactions`);
    }
    
    console.log(`Processed ${transactions.length} transactions for date range ${startDate} to ${endDate}`);
    console.log(`Breakdown - Income: ${transactions.filter(tx => tx.type === 'income').length}, Expenses: ${transactions.filter(tx => tx.type === 'expense').length}, Collaborators: ${transactions.filter(tx => tx.category === 'Pagos a colaboradores').length}`);
    
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
