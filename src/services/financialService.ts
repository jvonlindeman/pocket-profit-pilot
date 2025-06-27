
import { Transaction, FinancialSummary, CategorySummary, UnpaidInvoice, FinancialData } from "@/types/financial";
import { stripeRepository } from "@/repositories/stripeRepository";
import { zohoRepository } from "@/repositories/zohoRepository";
import { filterExcludedVendors } from "./zoho/api/processor";

/**
 * FinancialService orchestrates fetching and processing financial data
 */
export class FinancialService {
  private lastRawResponse: any = null;

  /**
   * Fetch financial data from Zoho and Stripe
   */
  async fetchFinancialData(
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh = false,
    callbacks: {
      onTransactions: (transactions: any[]) => void,
      onCollaboratorData: (data: any) => void,
      onIncomeTypes: (transactions: any[], stripeData: any) => void,
    }
  ): Promise<boolean> {
    try {
      // Fetch Zoho transactions
      let zohoTransactions = await zohoRepository.getTransactions(
        dateRange.startDate,
        dateRange.endDate,
        forceRefresh
      );
      
      // Filter out transactions from excluded vendors
      zohoTransactions = filterExcludedVendors(zohoTransactions);

      // Fetch Stripe transactions
      const stripeData = await stripeRepository.getTransactions(
        dateRange.startDate,
        dateRange.endDate,
        forceRefresh
      );
      
      // Combine transactions
      const combinedTransactions = [...zohoTransactions, ...stripeData.transactions];
      
      // Execute callbacks
      callbacks.onTransactions(combinedTransactions);
      callbacks.onIncomeTypes(zohoTransactions, stripeData);

      return true;
    } catch (error) {
      console.error("Error fetching financial data:", error);
      throw error;
    }
  }

  /**
   * Get the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse ||
      zohoRepository.getLastRawResponse();
  }
  
  /**
   * Save financial summary to database
   */
  async saveFinancialSummary(
    financialData: FinancialData, 
    dateRange: { startDate: Date; endDate: Date },
    cacheSegmentId: number | string | null
  ): Promise<number | null> {
    console.log("Saving financial summary:", { 
      summary: financialData.summary,
      dateRange,
      cacheSegmentId
    });
    
    // For now, just return a mock ID
    return 123;
  }

  /**
   * Check API connectivity for both Zoho and Stripe
   */
  async checkApiConnectivity(): Promise<{ zoho: boolean; stripe: boolean }> {
    const zoho = await zohoRepository.checkApiConnectivity();
    const stripe = await stripeRepository.checkApiConnectivity();
    return { zoho, stripe };
  }
}

// Export a singleton instance
export const financialService = new FinancialService();

/**
 * Helper function to identify Stripe fee transactions
 */
const isStripeFeeTransaction = (transaction: Transaction): boolean => {
  // Check if transaction is from Stripe and has fee-related keywords
  if (transaction.source !== 'Stripe') return false;
  
  const description = transaction.description?.toLowerCase() || '';
  const category = transaction.category?.toLowerCase() || '';
  
  // Common Stripe fee patterns
  const feePatterns = [
    'stripe fee',
    'processing fee',
    'transaction fee',
    'billing - usage fee',
    'stripe charge',
    'payment processing',
    'fee'
  ];
  
  // Check if it's a fee transaction based on description, category, or if it has negative amount with fee metadata
  return feePatterns.some(pattern => 
    description.includes(pattern) || 
    category.includes(pattern)
  ) || (transaction.type === 'expense' && transaction.category === 'fee');
};

// Add the processTransactionData function with corrected Stripe fee handling
export const processTransactionData = (
  transactions: Transaction[],
  startingBalance: number = 0,
  additionalCollaboratorExpenses: CategorySummary[] = []
): FinancialData => {
  // Separate operational expenses from Stripe fees
  const operationalExpenses = transactions.filter(tx => 
    tx.type === 'expense' && !isStripeFeeTransaction(tx)
  );
  
  const stripeFees = transactions.filter(tx => 
    tx.type === 'expense' && isStripeFeeTransaction(tx)
  );

  console.log("💰 processTransactionData: Separating expenses", {
    totalTransactions: transactions.length,
    operationalExpenses: operationalExpenses.length,
    stripeFees: stripeFees.length,
    stripeFeesTotal: stripeFees.reduce((sum, tx) => sum + tx.amount, 0)
  });

  // Calculate total income and operational expense (excluding Stripe fees)
  let totalIncome = 0;
  let totalOperationalExpense = 0;
  let collaboratorExpense = 0;
  let otherExpense = 0;

  // Group income by source and expenses by category
  const incomeBySource: { [key: string]: number } = {};
  const expenseByCategory: { [key: string]: number } = {};

  // Process income transactions
  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
      incomeBySource[transaction.category] = (incomeBySource[transaction.category] || 0) + transaction.amount;
    }
  });

  // Process ONLY operational expenses (excluding Stripe fees)
  operationalExpenses.forEach(transaction => {
    totalOperationalExpense += transaction.amount;
    expenseByCategory[transaction.category] = (expenseByCategory[transaction.category] || 0) + transaction.amount;
  });

  // Process collaborator expenses from additional data
  if (additionalCollaboratorExpenses && additionalCollaboratorExpenses.length > 0) {
    additionalCollaboratorExpenses.forEach(expense => {
      collaboratorExpense += expense.amount;
    });
  }

  // Calculate collaborator expense from operational transactions only
  operationalExpenses.forEach(transaction => {
    if (transaction.category === 'Pagos a colaboradores') {
      collaboratorExpense += transaction.amount;
    }
  });

  // Calculate other operational expenses (excluding collaborators)
  otherExpense = totalOperationalExpense - collaboratorExpense;

  // Convert incomeBySource to array
  const incomeBySourceArray: CategorySummary[] = Object.keys(incomeBySource).map(category => ({
    category,
    amount: incomeBySource[category],
    percentage: (incomeBySource[category] / totalIncome) * 100
  }));

  // Convert expenseByCategory to array (operational expenses only)
  const expenseByCategoryArray: CategorySummary[] = Object.keys(expenseByCategory).map(category => ({
    category,
    amount: expenseByCategory[category],
    percentage: (expenseByCategory[category] / totalOperationalExpense) * 100
  }));

  // Calculate profit using operational expenses only
  const profit = totalIncome - totalOperationalExpense;

  // Calculate profit margin
  const profitMargin = (profit / totalIncome) * 100;

  // Calculate gross profit
  const grossProfit = totalIncome - collaboratorExpense;

  // Calculate gross profit margin
  const grossProfitMargin = (grossProfit / totalIncome) * 100;

  // Prepare data for charts (daily and monthly) - using operational expenses only
  const incomeByDay: { [key: string]: number } = {};
  const expenseByDay: { [key: string]: number } = {};
  const incomeByMonth: { [key: string]: number } = {};
  const expenseByMonth: { [key: string]: number } = {};
  const profitByMonth: { [key: string]: number } = {};

  transactions.forEach(transaction => {
    const date = transaction.date;
    const month = date.substring(0, 7); // YYYY-MM

    if (transaction.type === 'income') {
      incomeByDay[date] = (incomeByDay[date] || 0) + transaction.amount;
      incomeByMonth[month] = (incomeByMonth[month] || 0) + transaction.amount;
    } else if (transaction.type === 'expense' && !isStripeFeeTransaction(transaction)) {
      // Only include operational expenses in charts
      expenseByDay[date] = (expenseByDay[date] || 0) + transaction.amount;
      expenseByMonth[month] = (expenseByMonth[month] || 0) + transaction.amount;
    }
  });

  // Calculate profit by month using operational expenses only
  Object.keys(incomeByMonth).forEach(month => {
    const monthlyIncome = incomeByMonth[month] || 0;
    const monthlyExpense = expenseByMonth[month] || 0;
    profitByMonth[month] = monthlyIncome - monthlyExpense;
  });

  // Convert chart data to arrays
  const createChartData = (data: { [key: string]: number }) => {
    const labels = Object.keys(data);
    const values = labels.map(label => data[label]);
    return { labels, values };
  };

  const incomeByDayChart = createChartData(incomeByDay);
  const expenseByDayChart = createChartData(expenseByDay);
  const incomeByMonthChart = createChartData(incomeByMonth);
  const expenseByMonthChart = createChartData(expenseByMonth);
  const profitByMonthChart = createChartData(profitByMonth);

  console.log("💰 processTransactionData: Final calculation results", {
    totalIncome,
    totalOperationalExpense,
    totalStripeFeesExcluded: stripeFees.reduce((sum, tx) => sum + tx.amount, 0),
    profit,
    profitMargin,
    collaboratorExpense,
    otherExpense
  });

  return {
    summary: {
      totalIncome: totalIncome,
      totalExpense: totalOperationalExpense, // Now excludes Stripe fees
      collaboratorExpense: collaboratorExpense,
      otherExpense: otherExpense,
      profit: profit,
      profitMargin: profitMargin,
      grossProfit: grossProfit,
      grossProfitMargin: grossProfitMargin,
      startingBalance: startingBalance
    },
    transactions: transactions,
    incomeBySource: incomeBySourceArray,
    expenseByCategory: expenseByCategoryArray,
    dailyData: {
      income: incomeByDayChart,
      expense: expenseByDayChart
    },
    monthlyData: {
      income: incomeByMonthChart,
      expense: expenseByMonthChart,
      profit: profitByMonthChart
    }
  };
};

// Add a new function to get unpaid invoices
export const getUnpaidInvoices = (): UnpaidInvoice[] => {
  return zohoRepository.getUnpaidInvoices();
};
