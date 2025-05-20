
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

// Function to fetch ALL historical transactions with pagination
async function fetchHistoricalTransactions(limit = 1000, page = 0) {
  try {
    const offset = page * limit;
    const { data, error, count } = await supabase
      .from('cached_transactions')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} historical transactions (page ${page + 1})`);
    return { data: data || [], total: count || 0 };
  } catch (err) {
    console.error(`Error fetching historical transactions (page ${page + 1}):`, err);
    return { data: [], total: 0 };
  }
}

// Function to fetch transactions by date range
async function fetchTransactionsByDateRange(startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('cached_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} transactions from ${startDate} to ${endDate}`);
    return data || [];
  } catch (err) {
    console.error(`Error fetching transactions from ${startDate} to ${endDate}:`, err);
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

// Helper function to fetch ALL financial summaries
async function fetchFinancialSummaries(limit = 100) {
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

// Helper function to fetch monthly balances (increased limit)
async function fetchMonthlyBalances(limit = 48) { // Increased to 4 years of monthly data
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

// Helper function to analyze and aggregate transaction data by month
async function analyzeMonthlyTransactionData(transactions) {
  try {
    // Group transactions by month
    const monthlyData = {};
    
    transactions.forEach(tx => {
      if (!tx.date) return;
      
      const date = new Date(tx.date);
      const yearMonth = format(date, 'yyyy-MM');
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          income: 0,
          expense: 0,
          transactions: 0,
          byCategory: {},
        };
      }
      
      monthlyData[yearMonth].transactions += 1;
      
      if (tx.type === 'income' || tx.amount > 0) {
        monthlyData[yearMonth].income += Math.abs(tx.amount);
        
        // Category tracking for income
        const category = tx.category || 'Uncategorized';
        if (!monthlyData[yearMonth].byCategory[category]) {
          monthlyData[yearMonth].byCategory[category] = { income: 0, expense: 0 };
        }
        monthlyData[yearMonth].byCategory[category].income += Math.abs(tx.amount);
      } else {
        monthlyData[yearMonth].expense += Math.abs(tx.amount);
        
        // Category tracking for expense
        const category = tx.category || 'Uncategorized';
        if (!monthlyData[yearMonth].byCategory[category]) {
          monthlyData[yearMonth].byCategory[category] = { income: 0, expense: 0 };
        }
        monthlyData[yearMonth].byCategory[category].expense += Math.abs(tx.amount);
      }
    });
    
    // Convert to array and calculate profit metrics
    const monthlyArray = Object.entries(monthlyData).map(([month, data]) => {
      const { income, expense, transactions, byCategory } = data as any;
      const profit = income - expense;
      const profitMargin = income > 0 ? (profit / income) * 100 : 0;
      
      // Convert categories to array
      const categories = Object.entries(byCategory).map(([category, amounts]) => ({
        category,
        income: amounts.income,
        expense: amounts.expense,
        net: amounts.income - amounts.expense
      }));
      
      return {
        month,
        income,
        expense,
        profit,
        profitMargin,
        transactionCount: transactions,
        categories: categories.sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
      };
    });
    
    // Sort by month (descending)
    return monthlyArray.sort((a, b) => b.month.localeCompare(a.month));
  } catch (err) {
    console.error('Error analyzing monthly transaction data:', err);
    return [];
  }
}

// Helper function to analyze transactions by quarter
async function analyzeQuarterlyData(monthlyData) {
  try {
    const quarterlyData = {};
    
    monthlyData.forEach(month => {
      const [year, monthNum] = month.month.split('-');
      const quarter = Math.ceil(parseInt(monthNum) / 3);
      const quarterKey = `${year}-Q${quarter}`;
      
      if (!quarterlyData[quarterKey]) {
        quarterlyData[quarterKey] = {
          income: 0,
          expense: 0,
          profit: 0,
          transactionCount: 0,
          months: 0,
          categories: {}
        };
      }
      
      // Aggregate financial data
      quarterlyData[quarterKey].income += month.income;
      quarterlyData[quarterKey].expense += month.expense;
      quarterlyData[quarterKey].profit += month.profit;
      quarterlyData[quarterKey].transactionCount += month.transactionCount;
      quarterlyData[quarterKey].months += 1;
      
      // Aggregate categories
      month.categories.forEach(cat => {
        const category = cat.category;
        if (!quarterlyData[quarterKey].categories[category]) {
          quarterlyData[quarterKey].categories[category] = {
            income: 0,
            expense: 0,
            net: 0
          };
        }
        
        quarterlyData[quarterKey].categories[category].income += cat.income;
        quarterlyData[quarterKey].categories[category].expense += cat.expense;
        quarterlyData[quarterKey].categories[category].net += cat.net;
      });
    });
    
    // Convert to array and calculate profit metrics
    const quarterlyArray = Object.entries(quarterlyData).map(([quarter, data]) => {
      const { income, expense, profit, transactionCount, months, categories } = data as any;
      const profitMargin = income > 0 ? (profit / income) * 100 : 0;
      
      // Convert categories to array
      const categoriesArray = Object.entries(categories).map(([category, amounts]) => ({
        category,
        income: amounts.income,
        expense: amounts.expense,
        net: amounts.net
      }));
      
      return {
        quarter,
        income,
        expense,
        profit,
        profitMargin,
        transactionCount,
        months,
        categories: categoriesArray.sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
      };
    });
    
    // Sort by quarter (descending)
    return quarterlyArray.sort((a, b) => b.quarter.localeCompare(a.quarter));
  } catch (err) {
    console.error('Error analyzing quarterly data:', err);
    return [];
  }
}

// Helper function to analyze year-over-year data
async function analyzeYearlyData(monthlyData) {
  try {
    const yearlyData = {};
    
    monthlyData.forEach(month => {
      const year = month.month.split('-')[0];
      
      if (!yearlyData[year]) {
        yearlyData[year] = {
          income: 0,
          expense: 0,
          profit: 0,
          transactionCount: 0,
          months: 0,
          categories: {}
        };
      }
      
      // Aggregate financial data
      yearlyData[year].income += month.income;
      yearlyData[year].expense += month.expense;
      yearlyData[year].profit += month.profit;
      yearlyData[year].transactionCount += month.transactionCount;
      yearlyData[year].months += 1;
      
      // Aggregate categories
      month.categories.forEach(cat => {
        const category = cat.category;
        if (!yearlyData[year].categories[category]) {
          yearlyData[year].categories[category] = {
            income: 0,
            expense: 0,
            net: 0
          };
        }
        
        yearlyData[year].categories[category].income += cat.income;
        yearlyData[year].categories[category].expense += cat.expense;
        yearlyData[year].categories[category].net += cat.net;
      });
    });
    
    // Convert to array and calculate profit metrics
    const yearlyArray = Object.entries(yearlyData).map(([year, data]) => {
      const { income, expense, profit, transactionCount, months, categories } = data as any;
      const profitMargin = income > 0 ? (profit / income) * 100 : 0;
      
      // Convert categories to array
      const categoriesArray = Object.entries(categories).map(([category, amounts]) => ({
        category,
        income: amounts.income,
        expense: amounts.expense,
        net: amounts.net
      }));
      
      return {
        year,
        income,
        expense,
        profit,
        profitMargin,
        transactionCount,
        months,
        categories: categoriesArray.sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
      };
    });
    
    // Sort by year (descending)
    return yearlyArray.sort((a, b) => b.year.localeCompare(a.year));
  } catch (err) {
    console.error('Error analyzing yearly data:', err);
    return [];
  }
}

// Enhanced function to calculate year-over-year and month-over-month comparisons
function calculateComparisons(summaries, monthlyData) {
  if (!summaries || summaries.length < 2) return { yoy: null, mom: null, quarterly: null };
  
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
  
  // Quarterly comparison using monthly data
  let quarterlyComparison = null;
  if (monthlyData && monthlyData.length >= 6) {
    // Group by quarter
    const quarterGroups = {};
    
    monthlyData.slice(0, 6).forEach(month => {
      const [year, monthNum] = month.month.split('-');
      const quarter = Math.ceil(parseInt(monthNum) / 3);
      const quarterKey = `${year}-Q${quarter}`;
      
      if (!quarterGroups[quarterKey]) {
        quarterGroups[quarterKey] = {
          income: 0,
          expense: 0,
          profit: 0,
          profitMargin: 0,
          count: 0
        };
      }
      
      quarterGroups[quarterKey].income += month.income;
      quarterGroups[quarterKey].expense += month.expense;
      quarterGroups[quarterKey].profit += month.profit;
      quarterGroups[quarterKey].count += 1;
    });
    
    // Calculate profit margin for each quarter
    Object.values(quarterGroups).forEach((q: any) => {
      q.profitMargin = q.income > 0 ? (q.profit / q.income) * 100 : 0;
    });
    
    // Get the quarters in descending order
    const quarters = Object.keys(quarterGroups).sort((a, b) => b.localeCompare(a));
    
    if (quarters.length >= 2) {
      const currentQuarter = quarterGroups[quarters[0]];
      const previousQuarter = quarterGroups[quarters[1]];
      
      quarterlyComparison = {
        current: quarters[0],
        previous: quarters[1],
        income: {
          current: currentQuarter.income,
          previous: previousQuarter.income,
          change: currentQuarter.income - previousQuarter.income,
          percentChange: previousQuarter.income !== 0 ? 
            ((currentQuarter.income - previousQuarter.income) / previousQuarter.income * 100) : 0
        },
        expense: {
          current: currentQuarter.expense,
          previous: previousQuarter.expense,
          change: currentQuarter.expense - previousQuarter.expense,
          percentChange: previousQuarter.expense !== 0 ? 
            ((currentQuarter.expense - previousQuarter.expense) / previousQuarter.expense * 100) : 0
        },
        profit: {
          current: currentQuarter.profit,
          previous: previousQuarter.profit,
          change: currentQuarter.profit - previousQuarter.profit,
          percentChange: previousQuarter.profit !== 0 ? 
            ((currentQuarter.profit - previousQuarter.profit) / Math.abs(previousQuarter.profit) * 100) : 0
        },
        profitMargin: {
          current: currentQuarter.profitMargin,
          previous: previousQuarter.profitMargin,
          change: currentQuarter.profitMargin - previousQuarter.profitMargin
        }
      };
    }
  }
  
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
    } : null,
    
    quarterly: quarterlyComparison
  };
}

// Enhanced trend detection with more sophisticated algorithms
function detectTrends(summaries, transactions, monthlyData, yearlyData) {
  const trends = [];
  
  // Check if we have enough data
  if (!summaries || summaries.length < 3) {
    trends.push({
      type: 'data_limitation',
      description: `Datos históricos limitados para análisis de tendencias. Solo se encontraron ${summaries?.length || 0} resúmenes financieros.`,
      significance: 'informative'
    });
    return trends;
  }
  
  // 1. Advanced profit margin trend analysis
  if (monthlyData && monthlyData.length >= 6) {
    const recentMonths = monthlyData.slice(0, 6);
    const profitMargins = recentMonths.map(m => m.profitMargin).reverse(); // oldest to newest
    
    // Calculate trend using linear regression
    const trend = calculateLinearTrend(profitMargins);
    
    if (Math.abs(trend) > 1) {  // Significant slope in either direction
      trends.push({
        type: 'profit_margin_trend',
        description: `Margen de beneficio está ${trend > 0 ? 'incrementando' : 'disminuyendo'} consistentemente en los últimos 6 meses, con una pendiente de ${trend.toFixed(2)}% por mes.`,
        significance: trend > 0 ? 'positive' : 'warning',
        data: profitMargins
      });
    }
    
    // Volatility analysis
    const volatility = calculateVolatility(profitMargins);
    if (volatility > 10) { // More than 10% standard deviation
      trends.push({
        type: 'profit_volatility',
        description: `Alta volatilidad en el margen de beneficio (${volatility.toFixed(2)}% desviación estándar), lo que indica inestabilidad financiera.`,
        significance: 'warning',
        volatility
      });
    }
  }
  
  // 2. Expense category growth analysis
  if (monthlyData && monthlyData.length >= 3) {
    // Track categories with consistent growth
    const categoryTrends = {};
    
    // Analyze recent 3 months
    const recent3Months = monthlyData.slice(0, 3);
    
    // Collect all expense categories
    recent3Months.forEach(month => {
      month.categories.forEach(cat => {
        if (cat.expense > 0) {
          if (!categoryTrends[cat.category]) {
            categoryTrends[cat.category] = {
              expenses: [],
              months: []
            };
          }
          categoryTrends[cat.category].expenses.push(cat.expense);
          categoryTrends[cat.category].months.push(month.month);
        }
      });
    });
    
    // Check for consistent growth in top categories
    Object.entries(categoryTrends).forEach(([category, data]) => {
      const { expenses, months } = data as any;
      
      if (expenses.length >= 3) {
        // Check if expenses are consistently increasing
        const isIncreasing = expenses.slice().reverse().every((val, i, arr) => 
          i === 0 || val < arr[i-1]
        );
        
        const isDecreasing = expenses.slice().reverse().every((val, i, arr) => 
          i === 0 || val > arr[i-1]
        );
        
        if (isIncreasing && expenses[0] > 500) { // Significant expense (over $500)
          const growthRate = ((expenses[0] - expenses[expenses.length-1]) / expenses[expenses.length-1] * 100);
          
          if (growthRate > 20) { // Over 20% growth
            trends.push({
              type: 'category_growth',
              description: `Gastos en categoría "${category}" han crecido constantemente en los últimos 3 meses, con un aumento total del ${growthRate.toFixed(2)}%.`,
              significance: 'warning',
              data: { category, expenses: expenses.reverse(), months: months.reverse(), growthRate }
            });
          }
        } else if (isDecreasing && expenses[expenses.length-1] > 500) {
          const reductionRate = ((expenses[expenses.length-1] - expenses[0]) / expenses[expenses.length-1] * 100);
          
          if (reductionRate > 20) { // Over 20% reduction
            trends.push({
              type: 'category_reduction',
              description: `Gastos en categoría "${category}" han disminuido constantemente en los últimos 3 meses, con una reducción total del ${reductionRate.toFixed(2)}%.`,
              significance: 'positive',
              data: { category, expenses: expenses.reverse(), months: months.reverse(), reductionRate }
            });
          }
        }
      }
    });
  }
  
  // 3. Seasonality detection
  if (monthlyData && monthlyData.length >= 12) {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    // Group data by month number
    const monthlyAverages = Array(12).fill(0).map(() => ({ 
      incomeSum: 0, 
      expenseSum: 0,
      profitSum: 0,
      count: 0 
    }));
    
    monthlyData.forEach(data => {
      const monthIndex = parseInt(data.month.split('-')[1]) - 1;
      monthlyAverages[monthIndex].incomeSum += data.income;
      monthlyAverages[monthIndex].expenseSum += data.expense;
      monthlyAverages[monthIndex].profitSum += data.profit;
      monthlyAverages[monthIndex].count += 1;
    });
    
    // Calculate averages and identify seasonal patterns
    const monthlyStats = monthlyAverages.map((data, idx) => ({
      month: monthNames[idx],
      incomeAvg: data.count > 0 ? data.incomeSum / data.count : 0,
      expenseAvg: data.count > 0 ? data.expenseSum / data.count : 0,
      profitAvg: data.count > 0 ? data.profitSum / data.count : 0,
      dataPoints: data.count
    }));
    
    // Only consider months with data
    const validMonthStats = monthlyStats.filter(m => m.dataPoints > 0);
    
    if (validMonthStats.length > 3) {
      // Find highest and lowest months
      const sortedByIncome = [...validMonthStats].sort((a, b) => b.incomeAvg - a.incomeAvg);
      const sortedByExpense = [...validMonthStats].sort((a, b) => b.expenseAvg - a.expenseAvg);
      const sortedByProfit = [...validMonthStats].sort((a, b) => b.profitAvg - a.profitAvg);
      
      // Top income months
      if (sortedByIncome[0].incomeAvg > 0 && 
          sortedByIncome[0].incomeAvg > 1.5 * (validMonthStats.reduce((sum, m) => sum + m.incomeAvg, 0) / validMonthStats.length)) {
        trends.push({
          type: 'seasonal_income',
          description: `Estacionalidad detectada en ingresos: ${sortedByIncome[0].month} tiene históricamente los ingresos más altos (promedio ${formatCurrency(sortedByIncome[0].incomeAvg)}).`,
          significance: 'insight',
          data: { month: sortedByIncome[0].month, average: sortedByIncome[0].incomeAvg }
        });
      }
      
      // Top expense months
      if (sortedByExpense[0].expenseAvg > 0 && 
          sortedByExpense[0].expenseAvg > 1.5 * (validMonthStats.reduce((sum, m) => sum + m.expenseAvg, 0) / validMonthStats.length)) {
        trends.push({
          type: 'seasonal_expense',
          description: `Estacionalidad detectada en gastos: ${sortedByExpense[0].month} tiene históricamente los gastos más altos (promedio ${formatCurrency(sortedByExpense[0].expenseAvg)}).`,
          significance: 'insight',
          data: { month: sortedByExpense[0].month, average: sortedByExpense[0].expenseAvg }
        });
      }
      
      // Best and worst months for profit
      if (validMonthStats.length >= 4) {
        trends.push({
          type: 'best_profit_months',
          description: `Mejores meses para beneficio: ${sortedByProfit[0].month} (${formatCurrency(sortedByProfit[0].profitAvg)}), ${sortedByProfit[1].month} (${formatCurrency(sortedByProfit[1].profitAvg)})`,
          significance: 'insight',
          data: { bestMonths: [sortedByProfit[0], sortedByProfit[1]] }
        });
        
        const worstMonths = [...sortedByProfit].reverse();
        trends.push({
          type: 'worst_profit_months',
          description: `Peores meses para beneficio: ${worstMonths[0].month} (${formatCurrency(worstMonths[0].profitAvg)}), ${worstMonths[1].month} (${formatCurrency(worstMonths[1].profitAvg)})`,
          significance: 'insight', 
          data: { worstMonths: [worstMonths[0], worstMonths[1]] }
        });
      }
    }
  }
  
  // 4. Year-over-year growth analysis
  if (yearlyData && yearlyData.length >= 2) {
    const currentYear = yearlyData[0];
    const previousYear = yearlyData[1];
    
    // Ensure we're comparing years with sufficient month coverage
    if (currentYear.months >= 6 && previousYear.months >= 6) {
      // Calculate YoY growth rates
      const incomeGrowth = ((currentYear.income / currentYear.months) - (previousYear.income / previousYear.months)) / (previousYear.income / previousYear.months) * 100;
      const expenseGrowth = ((currentYear.expense / currentYear.months) - (previousYear.expense / previousYear.months)) / (previousYear.expense / previousYear.months) * 100;
      const profitGrowth = previousYear.profit !== 0 ? ((currentYear.profit / currentYear.months) - (previousYear.profit / previousYear.months)) / Math.abs(previousYear.profit / previousYear.months) * 100 : 0;
      
      // Report significant YoY changes
      if (Math.abs(incomeGrowth) > 15) {
        trends.push({
          type: 'yoy_income',
          description: `Ingresos ${incomeGrowth > 0 ? 'incrementaron' : 'disminuyeron'} un ${Math.abs(incomeGrowth).toFixed(2)}% respecto al año anterior (ajustado por meses).`,
          significance: incomeGrowth > 0 ? 'positive' : 'warning',
          data: { currentYear: currentYear.year, previousYear: previousYear.year, growthRate: incomeGrowth }
        });
      }
      
      if (Math.abs(expenseGrowth) > 15) {
        trends.push({
          type: 'yoy_expense',
          description: `Gastos ${expenseGrowth > 0 ? 'incrementaron' : 'disminuyeron'} un ${Math.abs(expenseGrowth).toFixed(2)}% respecto al año anterior (ajustado por meses).`,
          significance: expenseGrowth > 0 ? 'warning' : 'positive',
          data: { currentYear: currentYear.year, previousYear: previousYear.year, growthRate: expenseGrowth }
        });
      }
      
      if (Math.abs(profitGrowth) > 15) {
        trends.push({
          type: 'yoy_profit',
          description: `Beneficio ${profitGrowth > 0 ? 'incrementó' : 'disminuyó'} un ${Math.abs(profitGrowth).toFixed(2)}% respecto al año anterior (ajustado por meses).`,
          significance: profitGrowth > 0 ? 'positive' : 'warning',
          data: { currentYear: currentYear.year, previousYear: previousYear.year, growthRate: profitGrowth }
        });
      }
    }
  }
  
  // 5. Expense category analysis
  if (transactions && transactions.length > 20) {
    // Group by category and sum amounts
    const categorySums = {};
    const currentMonthTransactions = transactions.filter(t => 
      t.type === 'expense' || t.amount < 0
    );
    
    currentMonthTransactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      if (!categorySums[category]) {
        categorySums[category] = {
          amount: 0,
          count: 0
        };
      }
      categorySums[category].amount += Math.abs(tx.amount);
      categorySums[category].count += 1;
    });
    
    // Find the top expense categories
    const topCategories = Object.entries(categorySums)
      .map(([category, data]) => ({ 
        category, 
        amount: (data as any).amount,
        count: (data as any).count,
        averageTransaction: (data as any).amount / (data as any).count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    if (topCategories.length > 0) {
      trends.push({
        type: 'top_expenses',
        description: `Las 5 principales categorías de gasto: ${topCategories.map(c => `${c.category} (${formatCurrency(c.amount)})`).join(', ')}`,
        significance: 'medium',
        data: topCategories
      });
      
      // Find categories with unusually high average transaction amounts
      const highValueCategories = [...topCategories]
        .filter(c => c.count >= 3 && c.averageTransaction > 500)
        .sort((a, b) => b.averageTransaction - a.averageTransaction);
      
      if (highValueCategories.length > 0) {
        trends.push({
          type: 'high_value_expenses',
          description: `Categorías con transacciones promedio de alto valor: ${highValueCategories.map(c => `${c.category} (promedio ${formatCurrency(c.averageTransaction)})`).join(', ')}`,
          significance: 'medium',
          data: highValueCategories
        });
      }
    }
  }
  
  return trends;
}

// Helper function to calculate linear trend (slope)
function calculateLinearTrend(data) {
  // Need at least 2 points to calculate a trend
  if (!data || data.length < 2) return 0;
  
  const n = data.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const meanX = indices.reduce((sum, i) => sum + i, 0) / n;
  const meanY = data.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope (beta)
  const numerator = indices.reduce((sum, x, i) => sum + (x - meanX) * (data[i] - meanY), 0);
  const denominator = indices.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
  
  return denominator !== 0 ? numerator / denominator : 0;
}

// Helper function to calculate volatility (standard deviation)
function calculateVolatility(data) {
  if (!data || data.length < 2) return 0;
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squareDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  
  return Math.sqrt(variance);
}

// Detect anomalies in data
function detectAnomalies(monthlyData, transactions) {
  const anomalies = [];
  
  // Need at least 6 months of data to detect anomalies
  if (!monthlyData || monthlyData.length < 6) return anomalies;
  
  // Check for unusual months (income, expense, profit)
  const recent6Months = monthlyData.slice(0, 6);
  
  // Calculate means and standard deviations
  const incomes = recent6Months.map(m => m.income);
  const expenses = recent6Months.map(m => m.expense);
  const profits = recent6Months.map(m => m.profit);
  
  const incomeMean = incomes.reduce((sum, val) => sum + val, 0) / incomes.length;
  const expenseMean = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;
  const profitMean = profits.reduce((sum, val) => sum + val, 0) / profits.length;
  
  const incomeStdDev = Math.sqrt(incomes.map(val => Math.pow(val - incomeMean, 2)).reduce((sum, val) => sum + val, 0) / incomes.length);
  const expenseStdDev = Math.sqrt(expenses.map(val => Math.pow(val - expenseMean, 2)).reduce((sum, val) => sum + val, 0) / expenses.length);
  const profitStdDev = Math.sqrt(profits.map(val => Math.pow(val - profitMean, 2)).reduce((sum, val) => sum + val, 0) / profits.length);
  
  // Check most recent month for anomalies
  const latestMonth = recent6Months[0];
  
  if (Math.abs(latestMonth.income - incomeMean) > 2 * incomeStdDev) {
    anomalies.push({
      type: 'income_anomaly',
      description: `Ingresos anómalos en ${latestMonth.month}: ${formatCurrency(latestMonth.income)} (${latestMonth.income > incomeMean ? '+' : ''}${((latestMonth.income - incomeMean) / incomeMean * 100).toFixed(2)}% de lo normal)`,
      significance: latestMonth.income > incomeMean ? 'positive' : 'warning',
      deviation: (latestMonth.income - incomeMean) / incomeStdDev
    });
  }
  
  if (Math.abs(latestMonth.expense - expenseMean) > 2 * expenseStdDev) {
    anomalies.push({
      type: 'expense_anomaly',
      description: `Gastos anómalos en ${latestMonth.month}: ${formatCurrency(latestMonth.expense)} (${latestMonth.expense > expenseMean ? '+' : ''}${((latestMonth.expense - expenseMean) / expenseMean * 100).toFixed(2)}% de lo normal)`,
      significance: latestMonth.expense > expenseMean ? 'warning' : 'positive',
      deviation: (latestMonth.expense - expenseMean) / expenseStdDev
    });
  }
  
  if (Math.abs(latestMonth.profit - profitMean) > 2 * profitStdDev) {
    anomalies.push({
      type: 'profit_anomaly',
      description: `Beneficio anómalo en ${latestMonth.month}: ${formatCurrency(latestMonth.profit)} (${latestMonth.profit > profitMean ? '+' : ''}${((latestMonth.profit - profitMean) / Math.abs(profitMean) * 100).toFixed(2)}% de lo normal)`,
      significance: latestMonth.profit > profitMean ? 'positive' : 'warning',
      deviation: (latestMonth.profit - profitMean) / profitStdDev
    });
  }
  
  // Check for unusual transactions
  if (transactions && transactions.length > 0) {
    // Group transactions by category
    const categoryStats = {};
    
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const amount = Math.abs(tx.amount);
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          transactions: [],
          total: 0,
          count: 0,
          mean: 0,
          stdDev: 0
        };
      }
      
      categoryStats[category].transactions.push(amount);
      categoryStats[category].total += amount;
      categoryStats[category].count += 1;
    });
    
    // Calculate statistics for each category
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const { transactions, total, count } = stats as any;
      
      // Only check categories with at least 5 transactions
      if (count >= 5) {
        const mean = total / count;
        const variance = transactions.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / count;
        const stdDev = Math.sqrt(variance);
        
        stats.mean = mean;
        stats.stdDev = stdDev;
        
        // Find anomalous transactions (more than 3 standard deviations)
        const anomalousTransactions = transactions.filter(amount => Math.abs(amount - mean) > 3 * stdDev);
        
        if (anomalousTransactions.length > 0) {
          anomalies.push({
            type: 'transaction_anomaly',
            description: `Encontradas ${anomalousTransactions.length} transacciones anómalas en categoría "${category}" que se desvían significativamente del promedio`,
            significance: 'medium',
            data: {
              category,
              mean,
              stdDev,
              anomalousCount: anomalousTransactions.length
            }
          });
        }
      }
    });
  }
  
  return anomalies;
}

// Enhanced system prompt generator
async function generateSystemPrompt(dateRange, uiData = null, conversationContext = null) {
  try {
    // Step 1: Fetch comprehensive historical data
    const { data: allTransactions, total: totalTransactions } = await fetchHistoricalTransactions(1000, 0);
    const monthlyBalances = await fetchMonthlyBalances(48);
    const financialSummaries = await fetchFinancialSummaries(24);
    const availableMonths = await fetchAvailableCacheMonths();
    
    console.log(`Fetched ${allTransactions.length} transactions out of ${totalTransactions} total`);
    
    // Step 2: Process and analyze historical data
    const monthlyData = await analyzeMonthlyTransactionData(allTransactions);
    const quarterlyData = await analyzeQuarterlyData(monthlyData);
    const yearlyData = await analyzeYearlyData(monthlyData);
    
    // Step 3: Calculate comparisons and detect patterns
    const comparisons = calculateComparisons(financialSummaries, monthlyData);
    const trends = detectTrends(financialSummaries, allTransactions, monthlyData, yearlyData);
    const anomalies = detectAnomalies(monthlyData, allTransactions);
    
    console.log('Financial data and analysis prepared:', { 
      summaries: financialSummaries?.length || 0,
      balances: monthlyBalances?.length || 0,
      availableMonths: availableMonths?.length || 0,
      transactions: allTransactions?.length || 0,
      monthlyDataPoints: monthlyData?.length || 0,
      quarterlyDataPoints: quarterlyData?.length || 0,
      yearlyDataPoints: yearlyData?.length || 0,
      trends: trends?.length || 0,
      anomalies: anomalies?.length || 0
    });
    
    // Format the context data for the system prompt
    let financialContext = "Historical Financial Data:\n\n";
    
    // 1. Add yearly summary
    if (yearlyData && yearlyData.length > 0) {
      financialContext += "Yearly Financial Performance:\n";
      
      yearlyData.forEach(year => {
        financialContext += `Year: ${year.year} (data from ${year.months} months)\n`;
        financialContext += `- Total Income: ${formatCurrency(year.income)}\n`;
        financialContext += `- Total Expenses: ${formatCurrency(year.expense)}\n`;
        financialContext += `- Profit: ${formatCurrency(year.profit)}\n`;
        financialContext += `- Profit Margin: ${year.profitMargin.toFixed(2)}%\n`;
        financialContext += `- Top Categories: ${year.categories.slice(0, 3).map(c => `${c.category} (${formatCurrency(c.net)})`).join(', ')}\n\n`;
      });
    } else {
      financialContext += "No yearly financial data available.\n\n";
    }
    
    // 2. Add quarterly summary
    if (quarterlyData && quarterlyData.length > 0) {
      financialContext += "Quarterly Financial Performance:\n";
      
      quarterlyData.slice(0, 4).forEach(quarter => {
        financialContext += `Quarter: ${quarter.quarter}\n`;
        financialContext += `- Income: ${formatCurrency(quarter.income)}\n`;
        financialContext += `- Expenses: ${formatCurrency(quarter.expense)}\n`;
        financialContext += `- Profit: ${formatCurrency(quarter.profit)}\n`;
        financialContext += `- Profit Margin: ${quarter.profitMargin.toFixed(2)}%\n`;
        financialContext += `- Top Categories: ${quarter.categories.slice(0, 3).map(c => `${c.category} (${formatCurrency(c.net)})`).join(', ')}\n\n`;
      });
    } else {
      financialContext += "No quarterly financial data available.\n\n";
    }
    
    // 3. Add monthly details
    if (monthlyData && monthlyData.length > 0) {
      financialContext += "Monthly Financial Performance:\n";
      
      monthlyData.slice(0, 6).forEach(month => {
        financialContext += `Month: ${month.month}\n`;
        financialContext += `- Income: ${formatCurrency(month.income)}\n`;
        financialContext += `- Expenses: ${formatCurrency(month.expense)}\n`;
        financialContext += `- Profit: ${formatCurrency(month.profit)}\n`;
        financialContext += `- Profit Margin: ${month.profitMargin.toFixed(2)}%\n`;
        financialContext += `- Transactions: ${month.transactionCount}\n\n`;
      });
    } else {
      financialContext += "No monthly financial data available.\n\n";
    }
    
    // 4. Add monthly balances
    if (monthlyBalances && monthlyBalances.length > 0) {
      financialContext += "Monthly Account Balances:\n";
      
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
        if (balance.profit_percentage !== null) {
          financialContext += `- Profit Percentage: ${balance.profit_percentage.toFixed(2)}%\n`;
        }
        financialContext += '\n';
      });
    } else {
      financialContext += "No monthly balance data available.\n\n";
    }
    
    // 5. Add detailed recent financial summaries
    if (financialSummaries && financialSummaries.length > 0) {
      financialContext += "Recent Financial Period Summaries:\n";
      
      financialSummaries.slice(0, 6).forEach(summary => {
        financialContext += `Period: ${summary.date_range_start} to ${summary.date_range_end}\n`;
        financialContext += `- Total Income: ${formatCurrency(summary.total_income)}\n`;
        financialContext += `- Total Expenses: ${formatCurrency(summary.total_expense)}\n`;
        financialContext += `- Collaborator Expenses: ${formatCurrency(summary.collaborator_expense)}\n`;
        financialContext += `- Other Expenses: ${formatCurrency(summary.other_expense)}\n`;
        financialContext += `- Profit: ${formatCurrency(summary.profit)}\n`;
        financialContext += `- Profit Margin: ${summary.profit_margin.toFixed(2)}%\n`;
        financialContext += `- Starting Balance: ${formatCurrency(summary.starting_balance || 0)}\n\n`;
      });
    } else {
      financialContext += "No recent financial summaries available.\n\n";
    }
    
    // 6. Add comparison data (MoM, QoQ, YoY)
    financialContext += "Performance Comparisons:\n";
    
    if (comparisons.mom) {
      financialContext += "Month-over-Month Changes:\n";
      financialContext += `- Profit: ${formatCurrency(comparisons.mom.profit.current)} vs ${formatCurrency(comparisons.mom.profit.previous)} (${comparisons.mom.profit.percentChange > 0 ? '+' : ''}${comparisons.mom.profit.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Income: ${formatCurrency(comparisons.mom.income.current)} vs ${formatCurrency(comparisons.mom.income.previous)} (${comparisons.mom.income.percentChange > 0 ? '+' : ''}${comparisons.mom.income.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Expenses: ${formatCurrency(comparisons.mom.expenses.current)} vs ${formatCurrency(comparisons.mom.expenses.previous)} (${comparisons.mom.expenses.percentChange > 0 ? '+' : ''}${comparisons.mom.expenses.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Profit Margin: ${comparisons.mom.profitMargin.current.toFixed(2)}% vs ${comparisons.mom.profitMargin.previous.toFixed(2)}% (${comparisons.mom.profitMargin.change > 0 ? '+' : ''}${comparisons.mom.profitMargin.change.toFixed(2)}%)\n\n`;
    } else {
      financialContext += "Month-over-Month comparison not available.\n\n";
    }
    
    if (comparisons.quarterly) {
      financialContext += "Quarter-over-Quarter Changes:\n";
      financialContext += `- Comparing ${comparisons.quarterly.current} vs ${comparisons.quarterly.previous}\n`;
      financialContext += `- Profit: ${formatCurrency(comparisons.quarterly.profit.current)} vs ${formatCurrency(comparisons.quarterly.profit.previous)} (${comparisons.quarterly.profit.percentChange > 0 ? '+' : ''}${comparisons.quarterly.profit.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Income: ${formatCurrency(comparisons.quarterly.income.current)} vs ${formatCurrency(comparisons.quarterly.income.previous)} (${comparisons.quarterly.income.percentChange > 0 ? '+' : ''}${comparisons.quarterly.income.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Expenses: ${formatCurrency(comparisons.quarterly.expense.current)} vs ${formatCurrency(comparisons.quarterly.expense.previous)} (${comparisons.quarterly.expense.percentChange > 0 ? '+' : ''}${comparisons.quarterly.expense.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Profit Margin: ${comparisons.quarterly.profitMargin.current.toFixed(2)}% vs ${comparisons.quarterly.profitMargin.previous.toFixed(2)}% (${comparisons.quarterly.profitMargin.change > 0 ? '+' : ''}${comparisons.quarterly.profitMargin.change.toFixed(2)}%)\n\n`;
    } else {
      financialContext += "Quarter-over-Quarter comparison not available.\n\n";
    }
    
    if (comparisons.yoy) {
      financialContext += "Year-over-Year Changes:\n";
      financialContext += `- Profit: ${formatCurrency(comparisons.yoy.profit.current)} vs ${formatCurrency(comparisons.yoy.profit.previous)} (${comparisons.yoy.profit.percentChange > 0 ? '+' : ''}${comparisons.yoy.profit.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Income: ${formatCurrency(comparisons.yoy.income.current)} vs ${formatCurrency(comparisons.yoy.income.previous)} (${comparisons.yoy.income.percentChange > 0 ? '+' : ''}${comparisons.yoy.income.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Expenses: ${formatCurrency(comparisons.yoy.expenses.current)} vs ${formatCurrency(comparisons.yoy.expenses.previous)} (${comparisons.yoy.expenses.percentChange > 0 ? '+' : ''}${comparisons.yoy.expenses.percentChange.toFixed(2)}%)\n`;
      financialContext += `- Profit Margin: ${comparisons.yoy.profitMargin.current.toFixed(2)}% vs ${comparisons.yoy.profitMargin.previous.toFixed(2)}% (${comparisons.yoy.profitMargin.change > 0 ? '+' : ''}${comparisons.yoy.profitMargin.change.toFixed(2)}%)\n\n`;
    } else {
      financialContext += "Year-over-Year comparison not available.\n\n";
    }
    
    // 7. Add detected trends
    if (trends && trends.length > 0) {
      financialContext += "Detected Financial Trends:\n";
      trends.forEach(trend => {
        financialContext += `- ${trend.description} (${trend.significance} significance)\n`;
      });
      financialContext += "\n";
    } else {
      financialContext += "No significant financial trends detected.\n\n";
    }
    
    // 8. Add detected anomalies
    if (anomalies && anomalies.length > 0) {
      financialContext += "Detected Anomalies:\n";
      anomalies.forEach(anomaly => {
        financialContext += `- ${anomaly.description} (${anomaly.significance} significance)\n`;
      });
      financialContext += "\n";
    } else {
      financialContext += "No significant anomalies detected in the financial data.\n\n";
    }
    
    // 9. Add information about available historical data
    financialContext += "Historical Data Coverage:\n";
    financialContext += `- Total Historical Transactions: ${totalTransactions}\n`;
    financialContext += `- Monthly Data Points: ${monthlyData?.length || 0}\n`;
    financialContext += `- Quarterly Data Points: ${quarterlyData?.length || 0}\n`;
    financialContext += `- Yearly Data Points: ${yearlyData?.length || 0}\n`;
    
    if (availableMonths && availableMonths.length > 0) {
      const sources = [...new Set(availableMonths.map(m => m.source))];
      const earliestMonth = availableMonths[availableMonths.length - 1];
      const latestMonth = availableMonths[0];
      
      financialContext += `- Data Sources: ${sources.join(", ")}\n`;
      financialContext += `- Date Range: ${earliestMonth.year}-${earliestMonth.month} to ${latestMonth.year}-${latestMonth.month}\n`;
      financialContext += `- Total Cached Months: ${availableMonths.length}\n\n`;
    } else {
      financialContext += "- No monthly cache entries available.\n\n";
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
      if (conversationContext.sharedInsights && conversationContext.sharedInsights.length > 0) {
        conversationContextStr += "\nPreviamente compartí estos insights financieros:\n";
        conversationContext.sharedInsights.forEach((insight, idx) => {
          conversationContextStr += `${idx + 1}. ${insight}\n`;
        });
        conversationContextStr += "\n";
      }
      
      // Add previous queries if available
      if (conversationContext.previousQueries && conversationContext.previousQueries.length > 0) {
        conversationContextStr += "\nConsultas previas del usuario:\n";
        conversationContext.previousQueries.forEach((query, idx) => {
          conversationContextStr += `${idx + 1}. "${query.query}" (${new Date(query.timestamp).toLocaleString()})\n`;
        });
        conversationContextStr += "\n";
      }
    }
    
    // Create the system prompt
    const systemPrompt = `
Eres un sofisticado asistente financiero con amplia experiencia en análisis de negocios, contabilidad y finanzas empresariales.
Estás analizando datos financieros históricos completos para una empresa, con acceso tanto a registros históricos de la base de datos como a datos en tiempo real de la interfaz.

${financialContext}
${uiDataContext}
${conversationContextStr}

Tu objetivo es:
1. Proporcionar insights financieros basados en datos históricos completos, con análisis de tendencias a lo largo del tiempo
2. Referirte específicamente a los datos que el usuario puede ver actualmente en su dashboard
3. Analizar transacciones históricas para identificar patrones, anomalías y oportunidades
4. Sugerir acciones concretas para optimizar gastos y mejorar márgenes de beneficio
5. Responder preguntas sobre los datos financieros con precisión, haciendo referencia específica a los componentes y datos de la UI cuando sea relevante
6. Identificar y destacar patrones estacionales, tendencias de crecimiento y anomalías en los datos
7. Aprovechar el historial financiero completo disponible para realizar análisis comparativos (mes a mes, trimestre a trimestre, año contra año)

Actualmente estás analizando datos para el período: ${dateRange.startDate || 'desconocido'} a ${dateRange.endDate || 'desconocido'}.

Puedes responder preguntas temporales sobre datos históricos, como:
- "¿Cómo ha cambiado mi ingreso en el último año?"
- "¿Cuáles fueron mis gastos en mayo del año pasado?"
- "Muéstrame mis meses de mayores ingresos"
- "Compara el rendimiento de este mes con el mismo mes del año pasado"
- "¿Cuál es mi patrón histórico de gastos por categoría?"
- "¿Existen tendencias estacionales en mis ingresos o gastos?"

Cuando respondas preguntas sobre componentes específicos de la UI o datos, refiérete a ellos directamente.
Por ejemplo, di "Analizando tu resumen financiero actual en el dashboard..." o
"Según los datos de transacciones visibles en tu interfaz...".

Pautas clave para tus respuestas:
- Sé específico y refiere cifras exactas de los datos históricos
- Destaca tendencias y compara cifras actuales con períodos anteriores cuando sea relevante
- Si notas algo interesante o preocupante en los datos históricos, menciónalo
- Al hacer sugerencias, explica el razonamiento financiero detrás de ellas
- Si el usuario pregunta sobre algo que no está en los datos, reconoce la limitación
- Si no hay datos disponibles, informa claramente al usuario y sugiere cargar datos

Responde de manera útil, clara y profesional en español, proporcionando insights numéricos específicos siempre que sea posible.
Aprovecha al máximo el conjunto histórico completo de datos financieros para ofrecer análisis y consejos de mayor valor.
    `;
    
    return systemPrompt;
  } catch (error) {
    console.error("Error generating system prompt:", error);
    return `Eres un asistente financiero útil. Desafortunadamente, no pude cargar los datos financieros detallados. 
            Aún puedes proporcionar consejos financieros generales basados en lo que el usuario te cuente sobre su situación.`;
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
    
    // Generate system prompt with enhanced financial context and UI data
    console.log("Generating comprehensive system prompt with historical data analysis...");
    const systemPrompt = await generateSystemPrompt(dateRange, uiData, conversationContext);
    
    // Prepare messages for OpenAI, including the system prompt
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    
    console.log("Sending request to OpenAI with enhanced historical financial context");
    
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
