
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { format, subMonths, parseISO } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const GPT_API_KEY = Deno.env.get('GPT_API_KEY') ?? '';

// Initialize the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to format data for better display
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Function to fetch all available monthly cache entries
async function fetchAvailableCacheMonths() {
  try {
    const { data: monthlyCache, error } = await supabase
      .from('monthly_cache')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) throw error;
    
    console.log(`Found ${monthlyCache?.length || 0} monthly cache entries`);
    return monthlyCache || [];
  } catch (err) {
    console.error('Error fetching monthly cache:', err);
    return [];
  }
}

// Function to fetch transactions for a specific month and source
async function fetchMonthTransactions(source: string, year: number, month: number) {
  try {
    const { data, error } = await supabase
      .from('cached_transactions')
      .select('*')
      .eq('source', source)
      .eq('year', year)
      .eq('month', month)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} transactions for ${source} ${year}-${month}`);
    return data || [];
  } catch (err) {
    console.error(`Error fetching transactions for ${source} ${year}-${month}:`, err);
    return [];
  }
}

// Helper function to fetch financial summaries
async function fetchFinancialSummaries(limit = 12) {
  try {
    const { data, error } = await supabase
      .from('financial_summaries')
      .select('*')
      .order('date_range_end', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} financial summaries`);
    return data || [];
  } catch (err) {
    console.error('Error fetching financial summaries:', err);
    return [];
  }
}

// Helper function to fetch monthly balances
async function fetchMonthlyBalances(limit = 12) {
  try {
    const { data, error } = await supabase
      .from('monthly_balances')
      .select('*')
      .order('month_year', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} monthly balances`);
    return data || [];
  } catch (err) {
    console.error('Error fetching monthly balances:', err);
    return [];
  }
}

// Helper to calculate year-over-year and month-over-month comparisons
function calculateComparisons(summaries) {
  if (!summaries || summaries.length < 2) return { yoy: null, mom: null };
  
  // Most recent two months for MoM comparison
  const currentMonth = summaries[0];
  const previousMonth = summaries[1];
  
  // Find same month last year for YoY comparison
  const currentMonthDate = new Date(currentMonth.date_range_start);
  const sameMonthLastYearDate = new Date(currentMonthDate);
  sameMonthLastYearDate.setFullYear(sameMonthLastYearDate.getFullYear() - 1);
  
  const sameMonthLastYear = summaries.find(s => {
    const startDate = new Date(s.date_range_start);
    return startDate.getMonth() === sameMonthLastYearDate.getMonth() &&
           startDate.getFullYear() === sameMonthLastYearDate.getFullYear();
  });
  
  return {
    mom: previousMonth ? {
      profit: {
        current: currentMonth.profit,
        previous: previousMonth.profit,
        change: currentMonth.profit - previousMonth.profit,
        percentChange: previousMonth.profit !== 0 ? ((currentMonth.profit - previousMonth.profit) / Math.abs(previousMonth.profit) * 100) : 0
      },
      income: {
        current: currentMonth.total_income,
        previous: previousMonth.total_income,
        change: currentMonth.total_income - previousMonth.total_income,
        percentChange: previousMonth.total_income !== 0 ? ((currentMonth.total_income - previousMonth.total_income) / previousMonth.total_income * 100) : 0
      },
      expenses: {
        current: currentMonth.total_expense,
        previous: previousMonth.total_expense,
        change: currentMonth.total_expense - previousMonth.total_expense,
        percentChange: previousMonth.total_expense !== 0 ? ((currentMonth.total_expense - previousMonth.total_expense) / previousMonth.total_expense * 100) : 0
      },
      profitMargin: {
        current: currentMonth.profit_margin,
        previous: previousMonth.profit_margin,
        change: currentMonth.profit_margin - previousMonth.profit_margin
      }
    } : null,
    
    yoy: sameMonthLastYear ? {
      profit: {
        current: currentMonth.profit,
        previous: sameMonthLastYear.profit,
        change: currentMonth.profit - sameMonthLastYear.profit,
        percentChange: sameMonthLastYear.profit !== 0 ? ((currentMonth.profit - sameMonthLastYear.profit) / Math.abs(sameMonthLastYear.profit) * 100) : 0
      },
      income: {
        current: currentMonth.total_income,
        previous: sameMonthLastYear.total_income,
        change: currentMonth.total_income - sameMonthLastYear.total_income,
        percentChange: sameMonthLastYear.total_income !== 0 ? ((currentMonth.total_income - sameMonthLastYear.total_income) / sameMonthLastYear.total_income * 100) : 0
      },
      expenses: {
        current: currentMonth.total_expense,
        previous: sameMonthLastYear.total_expense,
        change: currentMonth.total_expense - sameMonthLastYear.total_expense,
        percentChange: sameMonthLastYear.total_expense !== 0 ? ((currentMonth.total_expense - sameMonthLastYear.total_expense) / sameMonthLastYear.total_expense * 100) : 0
      },
      profitMargin: {
        current: currentMonth.profit_margin,
        previous: sameMonthLastYear.profit_margin,
        change: currentMonth.profit_margin - sameMonthLastYear.profit_margin
      }
    } : null
  };
}

// Helper function to detect trends in financial data
function detectTrends(summaries, transactions) {
  if (!summaries || summaries.length < 3) return [];
  
  const trends = [];
  
  // Detect profit margin trend
  const profitMargins = summaries.slice(0, 6).map(s => s.profit_margin);
  const isIncreasing = profitMargins.every((val, i) => i === 0 || val >= profitMargins[i - 1]);
  const isDecreasing = profitMargins.every((val, i) => i === 0 || val <= profitMargins[i - 1]);
  
  if (isIncreasing && profitMargins[0] > profitMargins[profitMargins.length - 1] + 5) {
    trends.push({
      type: 'profit_margin',
      description: `Profit margin has been steadily increasing over the last ${profitMargins.length} months, from ${profitMargins[profitMargins.length - 1].toFixed(2)}% to ${profitMargins[0].toFixed(2)}%`,
      significance: 'high'
    });
  } else if (isDecreasing && profitMargins[0] < profitMargins[profitMargins.length - 1] - 5) {
    trends.push({
      type: 'profit_margin',
      description: `Profit margin has been declining over the last ${profitMargins.length} months, from ${profitMargins[profitMargins.length - 1].toFixed(2)}% to ${profitMargins[0].toFixed(2)}%`,
      significance: 'high'
    });
  }
  
  // Detect expense categories with significant increases
  if (transactions && transactions.length > 0) {
    // Group by category and sum amounts
    const categorySums = {};
    const currentMonthTransactions = transactions.filter(t => 
      t.type === 'expense' || t.amount < 0
    );
    
    currentMonthTransactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      if (!categorySums[category]) {
        categorySums[category] = 0;
      }
      categorySums[category] += Math.abs(tx.amount);
    });
    
    // Find the top expense categories
    const topCategories = Object.entries(categorySums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (topCategories.length > 0) {
      trends.push({
        type: 'top_expenses',
        description: `Top expense categories: ${topCategories.map(([cat, amount]) => `${cat} (${formatCurrency(amount)})`).join(', ')}`,
        significance: 'medium'
      });
    }
  }
  
  // Detect income trend
  const incomes = summaries.slice(0, 3).map(s => s.total_income);
  const incomeChange = incomes.length > 1 ? 
    ((incomes[0] - incomes[incomes.length - 1]) / incomes[incomes.length - 1] * 100) : 0;
    
  if (Math.abs(incomeChange) > 20) {
    trends.push({
      type: 'income',
      description: `Income has ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(2)}% over the last ${incomes.length} months`,
      significance: incomeChange > 0 ? 'positive' : 'warning'
    });
  }
  
  return trends;
}

// Helper function to generate system prompt with context
async function generateSystemPrompt(dateRange, uiData = null, conversationContext = null) {
  try {
    // Fetch data from database
    const monthlyBalances = await fetchMonthlyBalances();
    const financialSummaries = await fetchFinancialSummaries(12);
    const availableMonths = await fetchAvailableCacheMonths();
    
    // Calculate comparisons for current period
    const comparisons = calculateComparisons(financialSummaries);
    
    // Get recent transactions for analysis
    let recentTransactions = [];
    if (availableMonths && availableMonths.length > 0) {
      // Get the most recent month's transactions
      const recentMonth = availableMonths[0];
      recentTransactions = await fetchMonthTransactions(recentMonth.source, recentMonth.year, recentMonth.month);
    }
    
    // Detect trends in financial data
    const trends = detectTrends(financialSummaries, recentTransactions);
    
    console.log('Financial data from database:', { 
      summaries: financialSummaries?.length || 0,
      balances: monthlyBalances?.length || 0,
      availableMonths: availableMonths?.length || 0,
      recentTransactions: recentTransactions?.length || 0,
      trends: trends?.length || 0
    });
    
    // Format the context data for the system prompt
    let financialContext = "Financial Summaries:\n";
    
    if (financialSummaries && financialSummaries.length > 0) {
      financialSummaries.forEach(summary => {
        financialContext += `Period: ${summary.date_range_start} to ${summary.date_range_end}\n`;
        financialContext += `- Income: ${formatCurrency(summary.total_income)}\n`;
        financialContext += `- Total Expenses: ${formatCurrency(summary.total_expense)}\n`;
        financialContext += `- Collaborator Expenses: ${formatCurrency(summary.collaborator_expense)}\n`;
        financialContext += `- Other Expenses: ${formatCurrency(summary.other_expense)}\n`;
        financialContext += `- Profit: ${formatCurrency(summary.profit)}\n`;
        financialContext += `- Profit Margin: ${summary.profit_margin.toFixed(2)}%\n\n`;
      });
    } else {
      financialContext += "No recent financial summaries available.\n\n";
    }
    
    financialContext += "Monthly Balances:\n";
    
    if (monthlyBalances && monthlyBalances.length > 0) {
      monthlyBalances.forEach(balance => {
        financialContext += `Month: ${balance.month_year}\n`;
        financialContext += `- Balance: ${formatCurrency(balance.balance)}\n`;
        if (balance.stripe_override !== null) {
          financialContext += `- Stripe Override: ${formatCurrency(balance.stripe_override)}\n`;
        }
        if (balance.opex_amount !== null) {
          financialContext += `- OPEX Amount: ${formatCurrency(balance.opex_amount)}\n`;
        }
        if (balance.itbm_amount !== null) {
          financialContext += `- ITBM Amount: ${formatCurrency(balance.itbm_amount)}\n`;
        }
        financialContext += `- Profit Percentage: ${balance.profit_percentage.toFixed(2)}%\n\n`;
      });
    } else {
      financialContext += "No monthly balances available.\n\n";
    }
    
    // Add comparison data if available
    if (comparisons.mom || comparisons.yoy) {
      financialContext += "Performance Comparisons:\n";
      
      if (comparisons.mom) {
        financialContext += "Month-over-Month Changes:\n";
        financialContext += `- Profit: ${formatCurrency(comparisons.mom.profit.current)} vs ${formatCurrency(comparisons.mom.profit.previous)} (${comparisons.mom.profit.percentChange > 0 ? '+' : ''}${comparisons.mom.profit.percentChange.toFixed(2)}%)\n`;
        financialContext += `- Income: ${formatCurrency(comparisons.mom.income.current)} vs ${formatCurrency(comparisons.mom.income.previous)} (${comparisons.mom.income.percentChange > 0 ? '+' : ''}${comparisons.mom.income.percentChange.toFixed(2)}%)\n`;
        financialContext += `- Expenses: ${formatCurrency(comparisons.mom.expenses.current)} vs ${formatCurrency(comparisons.mom.expenses.previous)} (${comparisons.mom.expenses.percentChange > 0 ? '+' : ''}${comparisons.mom.expenses.percentChange.toFixed(2)}%)\n`;
        financialContext += `- Profit Margin: ${comparisons.mom.profitMargin.current.toFixed(2)}% vs ${comparisons.mom.profitMargin.previous.toFixed(2)}% (${comparisons.mom.profitMargin.change > 0 ? '+' : ''}${comparisons.mom.profitMargin.change.toFixed(2)}%)\n\n`;
      }
      
      if (comparisons.yoy) {
        financialContext += "Year-over-Year Changes:\n";
        financialContext += `- Profit: ${formatCurrency(comparisons.yoy.profit.current)} vs ${formatCurrency(comparisons.yoy.profit.previous)} (${comparisons.yoy.profit.percentChange > 0 ? '+' : ''}${comparisons.yoy.profit.percentChange.toFixed(2)}%)\n`;
        financialContext += `- Income: ${formatCurrency(comparisons.yoy.income.current)} vs ${formatCurrency(comparisons.yoy.income.previous)} (${comparisons.yoy.income.percentChange > 0 ? '+' : ''}${comparisons.yoy.income.percentChange.toFixed(2)}%)\n`;
        financialContext += `- Expenses: ${formatCurrency(comparisons.yoy.expenses.current)} vs ${formatCurrency(comparisons.yoy.expenses.previous)} (${comparisons.yoy.expenses.percentChange > 0 ? '+' : ''}${comparisons.yoy.expenses.percentChange.toFixed(2)}%)\n`;
        financialContext += `- Profit Margin: ${comparisons.yoy.profitMargin.current.toFixed(2)}% vs ${comparisons.yoy.profitMargin.previous.toFixed(2)}% (${comparisons.yoy.profitMargin.change > 0 ? '+' : ''}${comparisons.yoy.profitMargin.change.toFixed(2)}%)\n\n`;
      }
    }
    
    // Add trends if detected
    if (trends && trends.length > 0) {
      financialContext += "Detected Financial Trends:\n";
      trends.forEach(trend => {
        financialContext += `- ${trend.description} (${trend.significance} significance)\n`;
      });
      financialContext += "\n";
    }
    
    // Add information about available historical data
    if (availableMonths && availableMonths.length > 0) {
      const sources = [...new Set(availableMonths.map(m => m.source))];
      const earliestMonth = availableMonths[availableMonths.length - 1];
      const latestMonth = availableMonths[0];
      
      financialContext += "Historical Data Coverage:\n";
      financialContext += `- Data Sources: ${sources.join(", ")}\n`;
      financialContext += `- Date Range: ${earliestMonth.year}-${earliestMonth.month} to ${latestMonth.year}-${latestMonth.month}\n`;
      financialContext += `- Total Cached Months: ${availableMonths.length}\n\n`;
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
        uiDataContext += `- Total Income: ${formatCurrency(uiData.summary.totalIncome || 0)}\n`;
        uiDataContext += `- Total Expenses: ${formatCurrency(uiData.summary.totalExpense || 0)}\n`;
        uiDataContext += `- Collaborator Expenses: ${formatCurrency(uiData.summary.collaboratorExpense || 0)}\n`;
        uiDataContext += `- Other Expenses: ${formatCurrency(uiData.summary.otherExpense || 0)}\n`;
        uiDataContext += `- Profit: ${formatCurrency(uiData.summary.profit || 0)}\n`;
        uiDataContext += `- Profit Margin: ${uiData.summary.profitMargin || 0}%\n`;
        uiDataContext += `- Starting Balance: ${formatCurrency(uiData.summary.startingBalance || 0)}\n\n`;
      } else {
        uiDataContext += "No financial summary available in the UI.\n\n";
      }
      
      // Add income breakdown
      const hasIncomeData = uiData.regularIncome || uiData.stripeIncome;
      uiDataContext += "Income Breakdown:\n";
      if (hasIncomeData) {
        uiDataContext += `- Regular Income: ${formatCurrency(uiData.regularIncome || 0)}\n`;
        uiDataContext += `- Stripe Income: ${formatCurrency(uiData.stripeIncome || 0)}\n`;
        uiDataContext += `- Stripe Fees: ${formatCurrency(uiData.stripeFees || 0)}\n`;
        uiDataContext += `- Stripe Net: ${formatCurrency(uiData.stripeNet || 0)}\n`;
        uiDataContext += `- Stripe Fee Percentage: ${uiData.stripeFeePercentage || 0}%\n\n`;
      } else {
        uiDataContext += "No income data currently visible in UI.\n\n";
      }
      
      // Add collaborator expenses
      if (uiData.collaboratorExpenses && uiData.collaboratorExpenses.length > 0) {
        uiDataContext += "Collaborator Expenses:\n";
        uiData.collaboratorExpenses.forEach(expense => {
          uiDataContext += `- ${expense.category}: ${formatCurrency(expense.amount || 0)}\n`;
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
          uiDataContext += `${index + 1}. [${date}] ${tx.description || 'No description'} - ${formatCurrency(tx.amount)} (${tx.type}) - Category: ${category}\n`;
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
7. When the user asks about historical data and trends, leverage the comprehensive financial history available to you

Currently analyzing data for the date range: ${dateRange.startDate || 'unknown'} to ${dateRange.endDate || 'unknown'}.

You can answer time-based questions about historical data, such as:
- "How did my income change over the past year?"
- "What were my expenses in May last year?"
- "Show me my highest-earning months"
- "Compare this month's performance to the same month last year"

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
    
    console.log("Sending request to OpenAI with enhanced financial context");
    
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
