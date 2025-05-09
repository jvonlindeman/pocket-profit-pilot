import { Transaction, CategorySummary, ChartData } from '@/types/financial';
import { format } from 'date-fns';

// Function to group transactions by date and sum the amounts
const groupTransactionsByDate = (transactions: Transaction[]): { [date: string]: number } => {
  const grouped: { [date: string]: number } = {};
  transactions.forEach(tx => {
    const date = tx.date;
    grouped[date] = (grouped[date] || 0) + tx.amount;
  });
  return grouped;
};

// Function to calculate daily income and expenses
export const calculateDailyAndMonthlyData = (transactions: Transaction[]): {
  income: ChartData;
  expense: ChartData;
  monthlyData: {
    income: ChartData;
    expense: ChartData;
    profit: ChartData;
  };
} => {
  // Filter income and expense transactions
  const incomeTransactions = transactions.filter(tx => tx.type === 'income');
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense');

  // Group transactions by date
  const dailyIncome = groupTransactionsByDate(incomeTransactions);
  const dailyExpense = groupTransactionsByDate(expenseTransactions);

  // Prepare labels and datasets for daily charts
  const allDates = Object.keys({ ...dailyIncome, ...dailyExpense }).sort();
  const dailyIncomeValues = allDates.map(date => dailyIncome[date] || 0);
  const dailyExpenseValues = allDates.map(date => dailyExpense[date] || 0);

  // Prepare monthly data
  const monthlyIncome: { [month: string]: number } = {};
  const monthlyExpense: { [month: string]: number } = {};

  incomeTransactions.forEach(tx => {
    const month = format(new Date(tx.date), 'yyyy-MM');
    monthlyIncome[month] = (monthlyIncome[month] || 0) + tx.amount;
  });

  expenseTransactions.forEach(tx => {
    const month = format(new Date(tx.date), 'yyyy-MM');
    monthlyExpense[month] = (monthlyExpense[month] || 0) + tx.amount;
  });

  const allMonths = Object.keys({ ...monthlyIncome, ...monthlyExpense }).sort();
  const monthlyIncomeValues = allMonths.map(month => monthlyIncome[month] || 0);
  const monthlyExpenseValues = allMonths.map(month => monthlyExpense[month] || 0);
  const monthlyProfitValues = allMonths.map((month, index) => monthlyIncomeValues[index] - monthlyExpenseValues[index]);

  return {
    income: {
      labels: allDates,
      values: dailyIncomeValues,
    },
    expense: {
      labels: allDates,
      values: dailyExpenseValues,
    },
    monthlyData: {
      income: {
        labels: allMonths,
        values: monthlyIncomeValues,
      },
      expense: {
        labels: allMonths,
        values: monthlyExpenseValues,
      },
      profit: {
        labels: allMonths,
        values: monthlyProfitValues,
      },
    },
  };
};

// Function to calculate income by source
export const calculateIncomeBySource = (transactions: Transaction[]): CategorySummary[] => {
  // Filter income transactions
  const incomeTransactions = transactions.filter(tx => tx.type === 'income');
  
  // Calculate total income
  const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Group by source and sum amounts
  const sourceMap: Record<string, number> = {};
  incomeTransactions.forEach(tx => {
    const source = tx.source || 'Unknown';
    sourceMap[source] = (sourceMap[source] || 0) + tx.amount;
  });
  
  // Convert to array of CategorySummary objects
  const incomeBySource = Object.entries(sourceMap).map(([source, amount]) => {
    const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
    return { category: source, amount, percentage };
  });
  
  // Sort by amount (descending)
  return incomeBySource.sort((a, b) => b.amount - a.amount);
};

// Functions that process expense data
export const calculateExpensesByCategory = (transactions: Transaction[]): CategorySummary[] => {
  // First filter expense transactions
  const expenseTransactions = transactions.filter((tx) => tx.type === 'expense');
  
  // Calculate total expense
  const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Group by category and sum amounts
  const categoryMap: Record<string, { amount: number, entries: number }> = {};
  
  expenseTransactions.forEach((tx) => {
    const category = tx.category || 'Otros';
    if (!categoryMap[category]) {
      categoryMap[category] = { amount: 0, entries: 0 };
    }
    categoryMap[category].amount += tx.amount;
    categoryMap[category].entries++;
  });
  
  // Convert to array of CategorySummary objects
  const expensesByCategory = Object.entries(categoryMap).map(([category, { amount, entries }]) => {
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    return { 
      category, 
      amount, 
      percentage,
      entries 
    };
  });
  
  // Sort by amount (descending)
  return expensesByCategory.sort((a, b) => b.amount - a.amount);
};
