
import { Transaction, FinancialSummary, FinancialData, CategorySummary, CacheStats } from '@/types/financial';
import { calculateDailyAndMonthlyData, calculateExpensesByCategory, calculateIncomeBySource } from './financeDataProcessor';
import { safeParseNumber } from './financialUtils';

// Helper function to safely extract a number from the data
const getNumber = (value: any): number => {
  return safeParseNumber(value);
};

// Helper function to initialize a default category summary
const createDefaultCategorySummary = (): CategorySummary => ({
  category: 'Default',
  amount: 0,
  percentage: 0
});

// Default financial data object
export const DEFAULT_FINANCIAL_DATA: FinancialData = {
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    collaboratorExpense: 0,
    otherExpense: 0,
    profit: 0,
    profitMargin: 0,
    startingBalance: 0,
  },
  transactions: [],
  monthlyData: {
    income: { labels: [], values: [] },
    expense: { labels: [], values: [] },
    profit: { labels: [], values: [] },
  },
  dailyData: {
    income: { labels: [], values: [] },
    expense: { labels: [], values: [] },
  },
  expenseByCategory: [],
  incomeBySource: [],
};

/**
 * Transform the raw API response into structured financial data
 * @param data Raw data from API
 * @param stripeIncomeData Stripe income data
 * @param updateCacheStatus Function to update cache status
 * @returns Processed financial data
 */
export const transformFinancialData = (
  data: any,
  stripeIncomeData: { amount: number, isOverridden: boolean },
  updateCacheStatus?: (data: any) => void
): FinancialData => {
  if (!data) {
    console.warn("No data provided to transformFinancialData, returning default data");
    return DEFAULT_FINANCIAL_DATA;
  }

  // Initialize transactions array
  let transactions: Transaction[] = [];

  // Initialize starting balance
  const startingBalance = getNumber(data.starting_balance);

  // Process transactions if available
  if (data.transactions && Array.isArray(data.transactions)) {
    transactions = data.transactions.map((item: any) => {
      const amount = getNumber(item.amount);
      return {
        id: item.id,
        date: item.date,
        amount: amount,
        description: item.description || '',
        category: item.category || 'Sin categoría',
        source: item.source || 'Zoho',
        type: item.type || 'expense',
      };
    });
  }

  // Calculate financial summary
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const profit = totalIncome - totalExpense;

  // Calculate daily and monthly data
  const { income, expense, monthlyData } = calculateDailyAndMonthlyData(transactions);

  // Construct daily data
  const dailyData = {
    income,
    expense
  };

  // Calculate expenses by category
  const expenseByCategory = calculateExpensesByCategory(transactions);

  // Calculate income by source
  const incomeBySource = calculateIncomeBySource(transactions);

  // Update cache status if provided
  if (updateCacheStatus && (data.cache_status || data.fromCache || data.cached)) {
    updateCacheStatus({
      usingCachedData: data.fromCache || data.cached || data.using_cached_data || false,
      partialRefresh: data.partialRefresh || data.partial_refresh || false,
      stats: data.cacheStats || data.cache_stats ? 
        {
          cachedCount: data.cacheStats?.cachedCount || data.cache_stats?.cached_count || 0,
          newCount: data.cacheStats?.newCount || data.cache_stats?.new_count || 0,
          totalCount: data.cacheStats?.totalCount || data.cache_stats?.total_count || 0,
        } 
        : null
    });
  }

  // Construct and return the transformed financial data
  const transformedData: FinancialData = {
    summary: {
      totalIncome,
      totalExpense,
      collaboratorExpense: 0, // Set default value if not provided
      otherExpense: 0, // Set default value if not provided
      profit,
      profitMargin: totalIncome > 0 ? (profit / totalIncome) * 100 : 0,
      startingBalance,
    },
    transactions,
    monthlyData,
    dailyData,
    expenseByCategory,
    incomeBySource,
  };

  return transformedData;
};
