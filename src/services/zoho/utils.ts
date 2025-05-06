
import { Transaction, FinancialData, ChartData, CategorySummary, FinancialSummary } from '@/types/financial';
import { format, parse, parseISO } from 'date-fns';

// Function to get the current year
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// Function to ensure dates are in the valid format
export const ensureValidDateFormat = (dateStr: string): string => {
  // Make sure the date is in YYYY-MM-DD format
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.warn(`Invalid date format: ${dateStr}, using current date`);
    return format(new Date(), 'yyyy-MM-dd');
  }
  return dateStr;
};

// Function to handle API errors
export const handleApiError = (err: any, message: string): string => {
  console.error(`${message}:`, err);
  
  let errorMessage = message;
  
  if (err.details) {
    errorMessage += `: ${err.details}`;
  } else if (err.message) {
    errorMessage += `: ${err.message}`;
  } 
  
  return errorMessage;
};

// Function to calculate daily data for a set of transactions
const calculateDailyData = (transactions: Transaction[]): { income: ChartData; expense: ChartData } => {
  const dailyIncome: { [key: string]: number } = {};
  const dailyExpense: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const formattedDate = format(parseISO(transaction.date), 'yyyy-MM-dd');
    if (transaction.type === 'income') {
      dailyIncome[formattedDate] = (dailyIncome[formattedDate] || 0) + transaction.amount;
    } else {
      dailyExpense[formattedDate] = (dailyExpense[formattedDate] || 0) + transaction.amount;
    }
  });

  const labels = Object.keys(dailyIncome).concat(Object.keys(dailyExpense).filter(date => !dailyIncome[date]));
  const incomeValues = labels.map(date => dailyIncome[date] || 0);
  const expenseValues = labels.map(date => dailyExpense[date] || 0);

  return {
    income: { labels, values: incomeValues },
    expense: { labels, values: expenseValues }
  };
};

// Function to calculate monthly data for a set of transactions
const calculateMonthlyData = (transactions: Transaction[]): { income: ChartData; expense: ChartData; profit: ChartData } => {
  const monthlyIncome: { [key: string]: number } = {};
  const monthlyExpense: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const formattedDate = format(parseISO(transaction.date), 'yyyy-MM');
    if (transaction.type === 'income') {
      monthlyIncome[formattedDate] = (monthlyIncome[formattedDate] || 0) + transaction.amount;
    } else {
      monthlyExpense[formattedDate] = (monthlyExpense[formattedDate] || 0) + transaction.amount;
    }
  });

  const labels = Object.keys(monthlyIncome).concat(Object.keys(monthlyExpense).filter(date => !monthlyIncome[date]));
  const incomeValues = labels.map(date => monthlyIncome[date] || 0);
  const expenseValues = labels.map(date => monthlyExpense[date] || 0);
  const profitValues = labels.map((date, index) => incomeValues[index] - expenseValues[index]);

  return {
    income: { labels, values: incomeValues },
    expense: { labels, values: expenseValues },
    profit: { labels, values: profitValues }
  };
};

// Function to calculate the total amount by category and the percentage
const calculateTotalByCategory = (transactions: Transaction[], type: 'income' | 'expense'): CategorySummary[] => {
  const categoryTotals: { [key: string]: number } = {};
  let total = 0;

  transactions.forEach(transaction => {
    if (transaction.type === type) {
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
      total += transaction.amount;
    }
  });

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100
    }))
    .sort((a, b) => b.amount - a.amount);
};

// Main function to process and format transaction data into a FinancialData object
export const processTransactionData = (transactions: Transaction[], startingBalance?: number): FinancialData => {
  // Calcular income y expense total
  let totalIncome = 0;
  let totalExpense = 0;
  let collaboratorExpense = 0;
  let otherExpense = 0;

  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
      
      // Separar gastos de colaboradores del resto
      if (transaction.category === 'Pagos a colaboradores') {
        collaboratorExpense += transaction.amount;
      } else {
        otherExpense += transaction.amount;
      }
    }
  });

  // Include starting balance in profit calculation if provided
  const profit = (startingBalance !== undefined ? startingBalance : 0) + totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

  // Crear objeto de resumen
  const summary: FinancialSummary = {
    totalIncome,
    totalExpense,
    collaboratorExpense,
    otherExpense,
    profit,
    profitMargin,
    startingBalance
  };

  // Calcular datos por categoría
  const incomeBySource = calculateTotalByCategory(transactions, 'income');
  const expenseByCategory = calculateTotalByCategory(transactions, 'expense');

  // Calcular datos diarios y mensuales
  const dailyData = calculateDailyData(transactions);
  const monthlyData = calculateMonthlyData(transactions);

  // Devolver objeto completo
  return {
    summary,
    transactions,
    incomeBySource,
    expenseByCategory,
    dailyData,
    monthlyData
  };
};
