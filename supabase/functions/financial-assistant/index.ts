
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const GPT_API_KEY = Deno.env.get('GPT_API_KEY') ?? '';

// Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to generate system prompt with context
async function generateSystemPrompt(dateRange) {
  try {
    // Fetch recent financial summaries
    const { data: financialSummaries, error: summariesError } = await supabase
      .from('financial_summaries')
      .select('*')
      .order('date_range_start', { ascending: false })
      .limit(5);
      
    if (summariesError) throw summariesError;
    
    // Fetch monthly balances
    const { data: monthlyBalances, error: balancesError } = await supabase
      .from('monthly_balances')
      .select('*')
      .order('month_year', { ascending: false })
      .limit(5);
      
    if (balancesError) throw balancesError;
    
    // Format the context data for the system prompt
    let financialContext = "Financial Summaries:\n";
    
    if (financialSummaries && financialSummaries.length > 0) {
      financialSummaries.forEach(summary => {
        financialContext += `Period: ${summary.date_range_start} to ${summary.date_range_end}\n`;
        financialContext += `- Income: $${summary.total_income}\n`;
        financialContext += `- Total Expenses: $${summary.total_expense}\n`;
        financialContext += `- Collaborator Expenses: $${summary.collaborator_expense}\n`;
        financialContext += `- Other Expenses: $${summary.other_expense}\n`;
        financialContext += `- Profit: $${summary.profit}\n`;
        financialContext += `- Profit Margin: ${summary.profit_margin}%\n\n`;
      });
    } else {
      financialContext += "No recent financial summaries available.\n\n";
    }
    
    financialContext += "Monthly Balances:\n";
    
    if (monthlyBalances && monthlyBalances.length > 0) {
      monthlyBalances.forEach(balance => {
        financialContext += `Month: ${balance.month_year}\n`;
        financialContext += `- Balance: $${balance.balance}\n`;
        if (balance.stripe_override !== null) {
          financialContext += `- Stripe Override: $${balance.stripe_override}\n`;
        }
        if (balance.opex_amount !== null) {
          financialContext += `- OPEX Amount: $${balance.opex_amount}\n`;
        }
        if (balance.itbm_amount !== null) {
          financialContext += `- ITBM Amount: $${balance.itbm_amount}\n`;
        }
        financialContext += `- Profit Percentage: ${balance.profit_percentage}%\n\n`;
      });
    } else {
      financialContext += "No monthly balances available.\n\n";
    }
    
    // Create the system prompt
    const systemPrompt = `
You are a helpful financial assistant with expertise in business finances, accounting, and financial analysis.
You are analyzing financial data for a small business, with the following context:

${financialContext}

Your goal is to:
1. Provide insights on profit trends, expense patterns, and financial health
2. When asked, help forecast future financial scenarios based on historical data
3. Suggest ways to optimize expenses and improve profit margins
4. Answer questions about the financial data clearly and accurately
5. If data is missing for a specific analysis, acknowledge that limitation
6. Be factual, precise, and provide numerical analysis when relevant

Currently analyzing data for the date range: ${dateRange.startDate} to ${dateRange.endDate}.

Respond in a helpful, clear, and professional manner, providing specific numeric insights whenever possible.
    `;
    
    return systemPrompt;
  } catch (error) {
    console.error("Error generating system prompt:", error);
    return `You are a helpful financial assistant. Unfortunately, I couldn't load the detailed financial data. 
            You can still provide general financial advice based on what the user tells you about their situation.`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GPT_API_KEY) {
      throw new Error("GPT_API_KEY is not configured");
    }

    const { messages, dateRange } = await req.json();
    
    // Generate system prompt with current financial context
    const systemPrompt = await generateSystemPrompt(dateRange);
    
    // Prepare messages for OpenAI, including the system prompt
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    
    console.log("Sending request to OpenAI with context and messages");
    
    // Make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GPT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }
    
    console.log("Received response from OpenAI");

    return new Response(JSON.stringify({ 
      response: data.choices[0].message,
      usage: data.usage
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
    
  } catch (error) {
    console.error("Error in financial-assistant function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
