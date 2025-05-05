
import { toast } from "@/hooks/use-toast";
import { Transaction } from "@/types/financial";

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
      income: 0,
      expense: 0,
      profit: 0,
    },
    expenseByCategory: [] as { name: string; value: number }[],
    dailyData: {
      income: [] as { date: string; amount: number }[],
      expense: [] as { date: string; amount: number }[],
    },
    monthlyData: [] as { month: string; income: number; expense: number; profit: number }[],
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
  
  // Calculate profit
  const profit = totalIncome - totalExpense;
  
  // Format expense categories for the chart
  const formattedExpenseCategories = Object.keys(expenseCategories)
    .map((category) => ({
      name: category,
      value: expenseCategories[category],
    }))
    .sort((a, b) => b.value - a.value); // Sort by value in descending order
  
  // Format daily data for the chart
  const formattedDailyIncome = Object.keys(dailyIncome)
    .map((date) => ({
      date,
      amount: dailyIncome[date],
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  
  const formattedDailyExpense = Object.keys(dailyExpense)
    .map((date) => ({
      date,
      amount: dailyExpense[date],
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  
  // Format monthly data for the chart
  const formattedMonthlyData = Object.keys(monthlyData)
    .map((month) => {
      const { income, expense } = monthlyData[month];
      return {
        month,
        income,
        expense,
        profit: income - expense,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month)); // Sort by month
  
  // Return the formatted data
  return {
    transactions: data,
    summary: {
      income: totalIncome,
      expense: totalExpense,
      profit,
    },
    expenseByCategory: formattedExpenseCategories,
    dailyData: {
      income: formattedDailyIncome,
      expense: formattedDailyExpense,
    },
    monthlyData: formattedMonthlyData,
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
