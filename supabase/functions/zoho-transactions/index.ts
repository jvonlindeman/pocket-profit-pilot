
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
  rawResponse?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (e) {
      console.error("❌ ZOHO-TRANSACTIONS: Invalid request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { startDate, endDate, forceRefresh, rawResponse } = body;
    
    if (!startDate || !endDate) {
      console.error("❌ ZOHO-TRANSACTIONS: Missing required parameters");
      return new Response(
        JSON.stringify({ error: "startDate and endDate are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`🔍 ZOHO-TRANSACTIONS: ENHANCED processing request from ${startDate} to ${endDate}`, {
      rawResponse: !!rawResponse,
      forceRefresh: !!forceRefresh,
      timestamp: new Date().toISOString()
    });

    // Get the webhook URL from environment variables
    const webhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    
    if (!webhookUrl) {
      console.error("❌ ZOHO-TRANSACTIONS: MAKE_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "Webhook URL not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Generate a unique request ID for tracing
    const requestId = crypto.randomUUID();
    console.log(`🚀 ZOHO-TRANSACTIONS: Making webhook call with Request ID: ${requestId}`);

    // Make direct call to the webhook with enhanced logging
    const webhookStartTime = Date.now();
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify({
        startDate,
        endDate,
        rawResponse: !!rawResponse,
        requestId,
        enhancedLogging: true, // Flag for enhanced processing
      }),
    });

    const webhookDuration = Date.now() - webhookStartTime;
    console.log(`⏱️ ZOHO-TRANSACTIONS: Webhook call completed in ${webhookDuration}ms`, {
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      requestId
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`❌ ZOHO-TRANSACTIONS: Webhook error (${webhookResponse.status}):`, {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        error: errorText,
        requestId,
        duration: webhookDuration
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Webhook returned ${webhookResponse.status}`,
          details: errorText,
          requestId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    // Parse webhook response with enhanced validation
    let data;
    try {
      data = await webhookResponse.json();
      console.log(`📊 ZOHO-TRANSACTIONS: ENHANCED webhook response analysis:`, {
        responseType: typeof data,
        isArray: Array.isArray(data),
        hasPayments: data?.payments && Array.isArray(data.payments),
        hasExpenses: data?.expenses && Array.isArray(data.expenses),
        hasCollaborators: data?.colaboradores && Array.isArray(data.colaboradores),
        hasCachedTransactions: data?.cached_transactions && Array.isArray(data.cached_transactions),
        paymentCount: data?.payments?.length || 0,
        expenseCount: data?.expenses?.length || 0,
        collaboratorCount: data?.colaboradores?.length || 0,
        cachedTransactionCount: data?.cached_transactions?.length || 0,
        dataKeys: data ? Object.keys(data) : [],
        requestId,
        duration: webhookDuration
      });

      // Enhanced validation for expense data
      if (data?.expenses && Array.isArray(data.expenses)) {
        console.log(`💰 ZOHO-TRANSACTIONS: EXPENSE DATA VALIDATION:`, {
          expenseCount: data.expenses.length,
          expenseAmounts: data.expenses.map((exp: any) => ({
            id: exp.id || exp.external_id,
            amount: exp.amount,
            category: exp.category,
            description: exp.description?.substring(0, 50),
            type: exp.type
          })),
          totalExpenseAmount: data.expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0),
          requestId
        });
      } else {
        console.warn(`⚠️ ZOHO-TRANSACTIONS: No expense data found in response`, {
          dataStructure: data ? Object.keys(data) : 'null',
          requestId
        });
      }

      // Enhanced validation for collaborator data
      if (data?.colaboradores && Array.isArray(data.colaboradores)) {
        console.log(`👥 ZOHO-TRANSACTIONS: COLLABORATOR DATA VALIDATION:`, {
          collaboratorCount: data.colaboradores.length,
          collaboratorAmounts: data.colaboradores.map((col: any) => ({
            id: col.id || col.external_id,
            amount: col.amount,
            category: col.category,
            description: col.description?.substring(0, 50)
          })),
          totalCollaboratorAmount: data.colaboradores.reduce((sum: number, col: any) => sum + (col.amount || 0), 0),
          requestId
        });
      }

    } catch (e) {
      console.error(`❌ ZOHO-TRANSACTIONS: JSON parsing error:`, {
        error: e.message,
        requestId,
        duration: webhookDuration
      });
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from webhook", 
          details: e.message,
          requestId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    // Return the data with enhanced metadata
    const responseWithMetadata = {
      ...data,
      _metadata: {
        requestId,
        processedAt: new Date().toISOString(),
        webhookDuration,
        enhancedProcessing: true,
        dataAnalysis: {
          hasPayments: !!(data?.payments && Array.isArray(data.payments)),
          hasExpenses: !!(data?.expenses && Array.isArray(data.expenses)),
          hasCollaborators: !!(data?.colaboradores && Array.isArray(data.colaboradores)),
          paymentCount: data?.payments?.length || 0,
          expenseCount: data?.expenses?.length || 0,
          collaboratorCount: data?.colaboradores?.length || 0
        }
      }
    };

    console.log(`✅ ZOHO-TRANSACTIONS: ENHANCED response ready`, {
      requestId,
      duration: webhookDuration,
      dataQuality: 'enhanced_with_metadata'
    });

    return new Response(
      JSON.stringify(responseWithMetadata),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ ZOHO-TRANSACTIONS: CRITICAL ERROR:", {
      error: error.message || "Unknown error",
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
