
import { toast } from "@/hooks/use-toast";
import { Transaction, FinancialSummary, CategorySummary, ChartData } from "@/types/financial";

// Helper function to get the current year
export const getCurrentYear = () => new Date().getFullYear();

// Helper function to ensure valid date format
export const ensureValidDateFormat = (dateStr: string) => {
  try {
    // Check if the date string is already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse the date and format it as YYYY-MM-DD
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // If we can't parse it, use the current date
    console.warn(`Invalid date format detected: ${dateStr}, using current date instead`);
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error(`Error processing date: ${dateStr}`, error);
    return new Date().toISOString().split('T')[0];
  }
};

// Helper function to process and normalize transaction data
export const processTransactionData = (data: Transaction[]) => {
  // Initialize the return object
  const result = {
    transactions: data,
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      profit: 0,
      profitMargin: 0,
    } as FinancialSummary,
    expenseByCategory: [] as CategorySummary[],
    dailyData: {
      income: { labels: [], values: [] } as ChartData,
      expense: { labels: [], values: [] } as ChartData,
    },
    monthlyData: {
      income: { labels: [], values: [] } as ChartData,
      expense: { labels: [], values: [] } as ChartData,
      profit: { labels: [], values: [] } as ChartData,
    },
  };
  
  // If no data, return empty result
  if (data.length === 0) {
    return result;
  }
  
  // Calculate summary
  let totalIncome = 0;
  let totalExpense = 0;
  
  // For expense categories
  const expenseCategories: Record<string, number> = {};
  
  // For daily data
  const dailyIncome: Record<string, number> = {};
  const dailyExpense: Record<string, number> = {};
  
  // For monthly data
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  
  // Process each transaction
  data.forEach((transaction) => {
    const { amount, type, date, category } = transaction;
    
    // Update summary
    if (type === 'income') {
      totalIncome += amount;
      
      // Update daily income
      if (!dailyIncome[date]) {
        dailyIncome[date] = 0;
      }
      dailyIncome[date] += amount;
      
      // Update monthly income
      const month = date.substring(0, 7); // Extract YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].income += amount;
    } else if (type === 'expense') {
      totalExpense += amount;
      
      // Update expense categories
      if (!expenseCategories[category]) {
        expenseCategories[category] = 0;
      }
      expenseCategories[category] += amount;
      
      // Update daily expense
      if (!dailyExpense[date]) {
        dailyExpense[date] = 0;
      }
      dailyExpense[date] += amount;
      
      // Update monthly expense
      const month = date.substring(0, 7); // Extract YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].expense += amount;
    }
  });
  
  // Calculate profit and profit margin
  const profit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  
  // Format expense categories for the chart
  const formattedExpenseCategories = Object.keys(expenseCategories)
    .map((category) => ({
      category,
      amount: expenseCategories[category],
      percentage: totalExpense > 0 ? (expenseCategories[category] / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by value in descending order
  
  // Format daily data for the chart
  const sortedDailyDates = Object.keys(dailyIncome).concat(Object.keys(dailyExpense))
    .filter((value, index, self) => self.indexOf(value) === index) // Get unique dates
    .sort(); // Sort dates
  
  const formattedDailyIncome = {
    labels: sortedDailyDates,
    values: sortedDailyDates.map(date => dailyIncome[date] || 0)
  };
  
  const formattedDailyExpense = {
    labels: sortedDailyDates,
    values: sortedDailyDates.map(date => dailyExpense[date] || 0)
  };
  
  // Format monthly data for the chart
  const sortedMonths = Object.keys(monthlyData).sort();
  
  const formattedMonthlyIncome = {
    labels: sortedMonths,
    values: sortedMonths.map(month => monthlyData[month].income || 0)
  };
  
  const formattedMonthlyExpense = {
    labels: sortedMonths,
    values: sortedMonths.map(month => monthlyData[month].expense || 0)
  };
  
  const formattedMonthlyProfit = {
    labels: sortedMonths,
    values: sortedMonths.map(month => 
      (monthlyData[month].income || 0) - (monthlyData[month].expense || 0)
    )
  };
  
  // Return the formatted data that matches our interfaces
  return {
    transactions: data,
    summary: {
      totalIncome,
      totalExpense,
      profit,
      profitMargin,
    },
    expenseByCategory: formattedExpenseCategories,
    dailyData: {
      income: formattedDailyIncome,
      expense: formattedDailyExpense,
    },
    monthlyData: {
      income: formattedMonthlyIncome,
      expense: formattedMonthlyExpense,
      profit: formattedMonthlyProfit,
    },
  };
};

// Helper function to handle API errors and provide better user feedback
export const handleApiError = (error: any, message: string) => {
  console.error(`ZohoService error: ${message}`, error);
  
  let errorMessage = message;
  
  // Extract more specific error messages from the response if available
  if (error?.details) {
    if (typeof error.details === 'string') {
      // Check for common errors
      if (error.details.includes('domain')) {
        errorMessage = 'Error al comunicarse con make.com. Por favor, intente de nuevo más tarde.';
      } else if (error.details.includes('invalid_organization')) {
        errorMessage = 'Error de configuración. Por favor, contacte al administrador.';
      } else if (error.details.includes('invalid_token')) {
        errorMessage = 'Error de autenticación con Zoho Books. Por favor, contacte al administrador.';
      } else if (error.details.includes('<!DOCTYPE html>')) {
        errorMessage = 'Error de comunicación con make.com. Por favor, intente de nuevo más tarde.';
      } else if (error?.message) {
        errorMessage = `${message}: ${error.message}`;
      }
    }
  }
  
  toast({
    title: 'Error de Zoho Books',
    description: errorMessage,
    variant: 'destructive'
  });
  
  return errorMessage;
};
