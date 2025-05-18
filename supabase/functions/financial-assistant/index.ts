
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
async function generateSystemPrompt(dateRange, uiData = null, conversationContext = null) {
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
    
    console.log('Financial data from database:', { 
      summaries: financialSummaries?.length || 0,
      balances: monthlyBalances?.length || 0
    });
    
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
    
    // Add UI data context if available
    let uiDataContext = "";
    if (uiData) {
      console.log('UI data received:', { 
        hasActiveComponents: Boolean(uiData.activeComponents?.length),
        activeComponentsCount: uiData.activeComponents?.length || 0,
        hasTransactions: Boolean(uiData.transactions?.length),
        transactionsCount: uiData.transactions?.length || 0,
        hasSummary: Boolean(uiData.summary)
      });
      
      uiDataContext = "\n\nCurrent UI Data:\n";
      
      // Add active UI components information
      if (uiData.activeComponents && uiData.activeComponents.length > 0) {
        uiDataContext += "Active Components in UI: " + uiData.activeComponents.join(", ") + "\n\n";
      } else {
        uiDataContext += "No active components detected in UI. User likely viewing a blank dashboard.\n\n";
      }
      
      // Add visible sections information
      if (uiData.visibleSections && uiData.visibleSections.length > 0) {
        uiDataContext += "Visible Sections: " + uiData.visibleSections.join(", ") + "\n";
        uiDataContext += "User's Current Focus: " + (uiData.focusedElement || "None") + "\n\n";
      }
      
      // Add summary information
      if (uiData.summary) {
        uiDataContext += "Financial Summary:\n";
        uiDataContext += `- Total Income: $${uiData.summary.totalIncome || 0}\n`;
        uiDataContext += `- Total Expenses: $${uiData.summary.totalExpense || 0}\n`;
        uiDataContext += `- Collaborator Expenses: $${uiData.summary.collaboratorExpense || 0}\n`;
        uiDataContext += `- Other Expenses: $${uiData.summary.otherExpense || 0}\n`;
        uiDataContext += `- Profit: $${uiData.summary.profit || 0}\n`;
        uiDataContext += `- Profit Margin: ${uiData.summary.profitMargin || 0}%\n`;
        uiDataContext += `- Starting Balance: $${uiData.summary.startingBalance || 0}\n\n`;
      } else {
        uiDataContext += "No financial summary available in the UI.\n\n";
      }
      
      // Add income breakdown
      const hasIncomeData = uiData.regularIncome || uiData.stripeIncome;
      uiDataContext += "Income Breakdown:\n";
      if (hasIncomeData) {
        uiDataContext += `- Regular Income: $${uiData.regularIncome || 0}\n`;
        uiDataContext += `- Stripe Income: $${uiData.stripeIncome || 0}\n`;
        uiDataContext += `- Stripe Fees: $${uiData.stripeFees || 0}\n`;
        uiDataContext += `- Stripe Net: $${uiData.stripeNet || 0}\n`;
        uiDataContext += `- Stripe Fee Percentage: ${uiData.stripeFeePercentage || 0}%\n\n`;
      } else {
        uiDataContext += "No income data currently visible in UI.\n\n";
      }
      
      // Add collaborator expenses
      if (uiData.collaboratorExpenses && uiData.collaboratorExpenses.length > 0) {
        uiDataContext += "Collaborator Expenses:\n";
        uiData.collaboratorExpenses.forEach(expense => {
          uiDataContext += `- ${expense.category}: $${expense.amount || 0}\n`;
        });
        uiDataContext += "\n";
      } else {
        uiDataContext += "No collaborator expense data visible in UI.\n\n";
      }
      
      // Add transaction insights if available
      if (uiData.transactionInsights && uiData.transactionInsights.length > 0) {
        uiDataContext += "Transaction Insights:\n";
        uiData.transactionInsights.forEach((insight) => {
          uiDataContext += `- ${insight.description} (${insight.significance} significance)\n`;
        });
        uiDataContext += "\n";
      } else {
        uiDataContext += "No transaction insights available.\n\n";
      }
      
      // Add metric comparisons if available
      if (uiData.currentMetricComparisons && uiData.currentMetricComparisons.length > 0) {
        uiDataContext += "Current Metric Comparisons:\n";
        uiData.currentMetricComparisons.forEach(comparison => {
          uiDataContext += `- ${comparison.metricName}: Current ${comparison.currentValue}% vs Previous ${comparison.previousValue}% (${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(2)}% change)\n`;
        });
        uiDataContext += "\n";
      } else {
        uiDataContext += "No metric comparisons available.\n\n";
      }
      
      // Add recent transactions
      if (uiData.transactions && uiData.transactions.length > 0) {
        uiDataContext += "Recent & Relevant Transactions:\n";
        uiData.transactions.forEach((tx, index) => {
          const date = tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'No date';
          const category = tx.category || 'Uncategorized';
          uiDataContext += `${index + 1}. [${date}] ${tx.description || 'No description'} - $${tx.amount} (${tx.type}) - Category: ${category}\n`;
        });
        uiDataContext += "\n";
      } else {
        uiDataContext += "No transactions currently visible in the UI.\n\n";
      }
      
      // Add interaction history if available
      if (uiData.interactionHistory && uiData.interactionHistory.length > 0) {
        uiDataContext += "Recent User Interactions:\n";
        uiData.interactionHistory.slice(0, 5).forEach((interaction, idx) => {
          uiDataContext += `${idx + 1}. ${interaction.action} on ${interaction.component} at ${new Date(interaction.timestamp).toLocaleTimeString()}\n`;
        });
        uiDataContext += "\n";
      } else {
        uiDataContext += "No recent UI interactions recorded.\n\n";
      }
    } else {
      console.log('No UI data received in request');
      uiDataContext = "\n\nUI Data: Not available. User may be on a different page or UI data collection failed.\n\n";
    }
    
    // Add conversation context if available
    let conversationContextStr = "";
    if (conversationContext) {
      conversationContextStr = "\nConversation Context:\n";
      if (conversationContext.lastQuery) {
        conversationContextStr += `Last query at: ${conversationContext.lastQuery.timestamp}\n`;
        if (conversationContext.lastQuery.visibleComponents) {
          conversationContextStr += `Components visible during last query: ${conversationContext.lastQuery.visibleComponents.join(", ")}\n`;
        }
        if (conversationContext.lastQuery.focusedElement) {
          conversationContextStr += `User was focused on: ${conversationContext.lastQuery.focusedElement}\n`;
        }
      }
      
      // Add previous insights if available
      if (conversationContext.sharedInsights) {
        conversationContextStr += "\nPreviously shared insights:\n";
        conversationContext.sharedInsights.forEach((insight, idx) => {
          conversationContextStr += `${idx + 1}. ${insight}\n`;
        });
        conversationContextStr += "\n";
      }
    }
    
    // Create the system prompt
    const systemPrompt = `
You are an advanced financial assistant with expertise in business finances, accounting, and financial analysis.
You are analyzing financial data for a business, with access to both historical database records and real-time UI data.

${financialContext}
${uiDataContext}
${conversationContextStr}

Your goal is to:
1. Provide data-driven insights on profit trends, expense patterns, and financial health
2. Refer specifically to the data the user can currently see in their dashboard
3. Analyze transactions and identify patterns, anomalies, or opportunities
4. Suggest actionable ways to optimize expenses and improve profit margins
5. Answer questions about the financial data with precision, specifically referencing UI components and data when relevant
6. When you notice significant patterns or outliers in the data, point them out even if not directly asked

Currently analyzing data for the date range: ${dateRange.startDate || 'unknown'} to ${dateRange.endDate || 'unknown'}.

When answering questions about specific UI components or data, refer to them directly.
For example, say "Looking at your current financial summary in the dashboard..." or
"Based on the transaction data visible in your interface...".

Key guidelines for your responses:
- Be specific and refer to exact numbers from the data
- Highlight trends and compare current figures to previous periods when relevant
- If you notice something interesting or concerning in the data, mention it
- When making suggestions, explain the financial reasoning behind them 
- If the user asks about something that's not in the data, acknowledge the limitation
- If there is no data available, inform the user clearly and suggest uploading data

Respond in a helpful, clear, and professional manner in Spanish, providing specific numeric insights whenever possible.
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

    const { messages, dateRange, uiData, conversationContext } = await req.json();
    
    // Log request information for debugging
    console.log("Financial assistant request received", {
      messageCount: messages?.length,
      hasDateRange: Boolean(dateRange),
      hasUIData: Boolean(uiData),
      hasConversationContext: Boolean(conversationContext),
      dateRange: dateRange ? {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      } : null
    });
    
    // Generate system prompt with current financial context and UI data
    const systemPrompt = await generateSystemPrompt(dateRange, uiData, conversationContext);
    
    // Prepare messages for OpenAI, including the system prompt
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    
    console.log("Sending request to OpenAI with context, UI data, and messages");
    
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
      console.error("OpenAI API error:", data.error);
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
