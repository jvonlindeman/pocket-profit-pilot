
import { DEFAULT_FINANCIAL_DATA } from '@/constants/financialDefaults';
import { FinancialData } from '@/types/financial';
import { safeParseNumber } from '@/utils/financialUtils';

/**
 * Process transactions into financial summary data
 * @param transactions Transaction data from API
 * @param stripeAmount Stripe income amount to include
 * @param startingBalance Optional starting balance
 * @returns Processed financial data object
 */
export const processTransactionsIntoFinancialData = (
  transactions: any[],
  stripeAmount: number,
  startingBalance?: number | null
): FinancialData => {
  console.log('🔄 Processing transactions into financial data format');
  
  // Calculate basic summary data
  const incomeTransactions = transactions.filter((tx: any) => tx.type === 'income');
  const expenseTransactions = transactions.filter((tx: any) => tx.type === 'expense');
  
  // Calculate Zoho income (excluding Stripe)
  const zohoIncomeTransactions = incomeTransactions.filter((tx: any) => tx.source === 'Zoho');
  const regularIncomeValue = zohoIncomeTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0);
  console.log('💰 Regular income from Zoho:', regularIncomeValue);
  
  // Extract collaborator expenses
  const collaboratorTransactions = expenseTransactions.filter((tx: any) => tx.category === 'Pagos a colaboradores');
  console.log('👥 Collaborator expenses:', collaboratorTransactions);
  
  // Calculate total income including Stripe
  console.log('💳 Stripe amount:', stripeAmount);
  
  const totalIncome = regularIncomeValue + stripeAmount;
  console.log('💵 Total income (Zoho + Stripe):', totalIncome);
  
  const totalExpense = expenseTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0);
  const profit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  
  console.log("📊 Financial summary calculation:", {
    regularIncome: regularIncomeValue,
    stripeIncome: stripeAmount,
    totalIncome,
    totalExpense,
    profit,
    profitMargin
  });
  
  // Create the financial_data structure that the app expects
  const transformedData = {
    summary: {
      totalIncome,
      totalExpense,
      profit,
      profitMargin,
      collaboratorExpense: collaboratorTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0),
      otherExpense: totalExpense - collaboratorTransactions.reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0),
      startingBalance: startingBalance ?? DEFAULT_FINANCIAL_DATA.summary.startingBalance
    },
    transactions,
    incomeBySource: [], // Will be populated later
    expenseByCategory: [],
    dailyData: {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] }
    },
    monthlyData: {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] },
      profit: { labels: [], values: [] }
    }
  };
  
  // Process daily transaction data
  processTransactionsByDate(transactions, transformedData);
  
  // Process monthly transaction data
  processTransactionsByMonth(transactions, transformedData);
  
  // Process expense by category
  processExpensesByCategory(expenseTransactions, transformedData);
  
  console.log("🔄 Created transformed financial data structure");
  
  return transformedData;
};

/**
 * Process transactions grouped by date for daily charts
 */
const processTransactionsByDate = (transactions: any[], financialData: FinancialData): void => {
  const transactionsByDate = new Map();
  
  transactions.forEach((tx: any) => {
    const date = tx.date;
    if (!transactionsByDate.has(date)) {
      transactionsByDate.set(date, { income: 0, expense: 0 });
    }
    if (tx.type === 'income') {
      transactionsByDate.get(date).income += safeParseNumber(tx.amount || 0);
    } else {
      transactionsByDate.get(date).expense += safeParseNumber(tx.amount || 0);
    }
  });
  
  // Sort dates and create daily chart data
  const sortedDates = Array.from(transactionsByDate.keys()).sort();
  financialData.dailyData = {
    income: { 
      labels: sortedDates, 
      values: sortedDates.map(date => transactionsByDate.get(date)?.income || 0) 
    },
    expense: { 
      labels: sortedDates, 
      values: sortedDates.map(date => transactionsByDate.get(date)?.expense || 0) 
    }
  };
};

/**
 * Process transactions grouped by month for monthly charts
 */
const processTransactionsByMonth = (transactions: any[], financialData: FinancialData): void => {
  const transactionsByMonth = new Map();
  
  transactions.forEach((tx: any) => {
    // Extract month-year from date (YYYY-MM)
    const monthYear = tx.date.substring(0, 7);
    if (!transactionsByMonth.has(monthYear)) {
      transactionsByMonth.set(monthYear, { income: 0, expense: 0 });
    }
    if (tx.type === 'income') {
      transactionsByMonth.get(monthYear).income += safeParseNumber(tx.amount || 0);
    } else {
      transactionsByMonth.get(monthYear).expense += safeParseNumber(tx.amount || 0);
    }
  });
  
  // Sort months and create monthly chart data
  const sortedMonths = Array.from(transactionsByMonth.keys()).sort();
  const monthlyLabels = sortedMonths.map(month => {
    const [year, monthNum] = month.split('-');
    return `${monthNum}/${year.substr(2)}`;
  });
  
  const monthlyIncomeValues = sortedMonths.map(month => transactionsByMonth.get(month)?.income || 0);
  const monthlyExpenseValues = sortedMonths.map(month => transactionsByMonth.get(month)?.expense || 0);
  const monthlyProfitValues = sortedMonths.map((month) => 
    (transactionsByMonth.get(month)?.income || 0) - (transactionsByMonth.get(month)?.expense || 0)
  );
  
  financialData.monthlyData = {
    income: { labels: monthlyLabels, values: monthlyIncomeValues },
    expense: { labels: monthlyLabels, values: monthlyExpenseValues },
    profit: { labels: monthlyLabels, values: monthlyProfitValues }
  };
};

/**
 * Process expenses grouped by category
 */
const processExpensesByCategory = (expenseTransactions: any[], financialData: FinancialData): void => {
  const expensesByCategory = new Map();
  
  expenseTransactions.forEach((tx: any) => {
    const category = tx.category || 'Sin categoría';
    if (!expensesByCategory.has(category)) {
      expensesByCategory.set(category, 0);
    }
    expensesByCategory.set(category, expensesByCategory.get(category) + safeParseNumber(tx.amount || 0));
  });
  
  financialData.expenseByCategory = Array.from(expensesByCategory.entries())
    .map(([category, amount]) => ({ 
      category, 
      amount: safeParseNumber(amount) 
    }))
    .sort((a, b) => b.amount - a.amount);
};
