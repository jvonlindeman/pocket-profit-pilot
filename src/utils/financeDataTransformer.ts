import { Transaction, FinancialSummary, FinancialData, CategorySummary, CacheStats } from '@/types/financial';
import { calculateDailyAndMonthlyData, calculateExpensesByCategory, calculateIncomeBySource } from './financeDataProcessor';
import { safeParseNumber } from './financialUtils';
import { DEFAULT_FINANCIAL_DATA } from '@/constants/financialDefaults';
import { CacheStatus as CacheStatusType } from '@/types/cache'; 

/**
 * Interface for cache status information
 */
interface CacheStatus {
  usingCachedData: boolean;
  partialRefresh: boolean;
  stats: CacheStats | null;
}

/**
 * Process raw transaction data into the standard financial data format
 * @param transactions Transaction list
 * @param stripeAmount Stripe income amount
 * @param startingBalance Optional starting balance
 * @returns Processed financial data
 */
export const processTransactionsIntoFinancialData = (
  transactions: Transaction[],
  stripeAmount: number,
  startingBalance: number | null
): FinancialData => {
  // Filter income and expense transactions
  const incomeTransactions = transactions.filter(tx => tx.type === 'income');
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
  
  // Calculate regular income (excluding stripe)
  const regularIncome = incomeTransactions
    .filter(tx => tx.source !== 'Stripe')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Calculate total income including Stripe
  const totalIncome = regularIncome + stripeAmount;
  
  // Calculate total expenses
  const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Calculate profit and profit margin
  const profit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  
  // Calculate collaborator expenses - updated to check for all variations of collaborator categories
  const collaboratorExpense = expenseTransactions
    .filter(tx => {
      const category = tx.category.toLowerCase();
      return category === 'colaboradores' || 
             category === 'collaborators' || 
             category === 'pagos a colaboradores' ||
             category.includes('colaborador') ||
             category.includes('collaborator');
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  console.log('👥 Calculating collaborator expenses:', { 
    totalCollaborators: collaboratorExpense,
    categories: expenseTransactions.map(tx => tx.category)
  });
  
  // Calculate other expenses
  const otherExpense = totalExpense - collaboratorExpense;
  
  // Process chart data
  const chartData = calculateDailyAndMonthlyData(transactions);
  
  // Process income by source and expenses by category
  const incomeBySource = calculateIncomeBySource(transactions);
  const expenseByCategory = calculateExpensesByCategory(transactions);
  
  // Combine all data into the final structure
  return {
    summary: {
      totalIncome,
      totalExpense,
      collaboratorExpense,
      otherExpense,
      profit,
      profitMargin,
      startingBalance: startingBalance || 0
    },
    transactions,
    incomeBySource,
    expenseByCategory,
    dailyData: chartData.income && chartData.expense ? {
      income: chartData.income,
      expense: chartData.expense
    } : {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] }
    },
    monthlyData: chartData.monthlyData ? chartData.monthlyData : {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] },
      profit: { labels: [], values: [] }
    }
  };
};

/**
 * Transform financial data from API response to application format
 * @param data Raw data from API
 * @param stripeIncomeData Stripe income data
 * @param updateCacheStatus Function to update cache status
 * @returns Processed financial data
 */
export const transformFinancialData = (
  data: any, 
  stripeIncomeData: { amount: number, isOverridden: boolean },
  updateCacheStatus: (status: CacheStatusType) => void
): FinancialData => {
  // Check if we have the expected data format or if we need to transform it
  if (!data.financial_data && data.cached_transactions) {
    console.log('🔄 Transforming cached_transactions to financial_data format');
    
    const transactions = data.cached_transactions || [];
    const stripeAmount = safeParseNumber(stripeIncomeData.amount || 0);
    const startingBalance = data.starting_balance || null;
    
    const transformedData = processTransactionsIntoFinancialData(
      transactions,
      stripeAmount,
      startingBalance
    );
    
    // Preserve cache status information from the API response
    updateCacheStatusFromResponse(data, updateCacheStatus);
    
    return transformedData;
  }
  
  if (!data.financial_data) {
    console.warn('⚠️ No financial_data found in the response and unable to transform:', data);
    // Return default data with a properly structured summary including Stripe income
    const defaultData = JSON.parse(JSON.stringify(DEFAULT_FINANCIAL_DATA)); // Deep clone to avoid mutations
    const stripeAmount = safeParseNumber(stripeIncomeData.amount || 0);
    defaultData.summary.totalIncome = stripeAmount;
    defaultData.summary.profit = stripeAmount;
    defaultData.summary.profitMargin = 100; // If only income, no expenses
    
    // Preserve cache status information from the API response
    updateCacheStatusFromResponse(data, updateCacheStatus);
    
    return defaultData;
  }
  
  // If we have the expected data.financial_data structure, process it normally
  const regularIncomeValue = safeParseNumber(data.financial_data.summary.totalIncome || 0);
  console.log('💰 Regular income from Zoho:', regularIncomeValue);
  
  // Calculate total income including Stripe
  const stripeAmount = safeParseNumber(stripeIncomeData.amount || 0);
  console.log('💳 Stripe amount:', stripeAmount);
  
  const totalIncome = regularIncomeValue + stripeAmount;
  console.log('💵 Total income (Zoho + Stripe):', totalIncome);
  
  const totalExpense = safeParseNumber(data.financial_data.summary.totalExpense || 0);
  
  // Re-calculate collaborator expenses to ensure all variations are caught
  const collaboratorExpense = Array.isArray(data.financial_data.transactions) 
    ? data.financial_data.transactions
        .filter((tx: any) => {
          if (tx.type !== 'expense') return false;
          const category = String(tx.category || '').toLowerCase();
          return category === 'colaboradores' || 
                 category === 'collaborators' || 
                 category === 'pagos a colaboradores' ||
                 category.includes('colaborador') ||
                 category.includes('collaborator');
        })
        .reduce((sum: number, tx: any) => sum + safeParseNumber(tx.amount || 0), 0)
    : safeParseNumber(data.financial_data.summary.collaboratorExpense || 0);
  
  // Calculate other expenses
  const otherExpense = totalExpense - collaboratorExpense;
  
  // Calculate profit and profit margin
  const profit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  
  console.log("📊 Financial summary calculation:", {
    regularIncome: regularIncomeValue,
    stripeIncome: stripeAmount,
    totalIncome,
    totalExpense,
    collaboratorExpense,
    otherExpense,
    profit,
    profitMargin
  });
  
  // Update summary with calculated values
  const updatedData = {
    ...data.financial_data,
    summary: {
      ...data.financial_data.summary,
      totalIncome: totalIncome,
      collaboratorExpense: collaboratorExpense,
      otherExpense: otherExpense,
      profit: profit,
      profitMargin: profitMargin,
      // Make sure starting balance is preserved
      startingBalance: data.financial_data.summary.startingBalance || data.starting_balance || DEFAULT_FINANCIAL_DATA.summary.startingBalance
    },
    // Ensure all required structure exists
    incomeBySource: data.financial_data.incomeBySource || [],
    expenseByCategory: data.financial_data.expenseByCategory || [],
    dailyData: data.financial_data.dailyData || {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] }
    },
    monthlyData: data.financial_data.monthlyData || {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] },
      profit: { labels: [], values: [] }
    }
  };
  
  // Preserve cache status information from the API response
  updateCacheStatusFromResponse(data, updateCacheStatus);
  
  return updatedData;
};

/**
 * Extract and update cache status from API response
 */
const updateCacheStatusFromResponse = (data: any, updateCacheStatus: (status: CacheStatusType) => void): void => {
  if (data.fromCache || data.cached || data.partialRefresh) {
    updateCacheStatus({
      usingCachedData: Boolean(data.fromCache || data.cached),
      partialRefresh: Boolean(data.partialRefresh),
      stats: data.cacheStats || data.newTransactionsCount 
        ? { 
            cachedCount: data.cacheStats?.cachedCount || 0,
            newCount: data.newTransactionsCount || 0,
            totalCount: data.cacheStats?.totalCount || 0,
            lastRefresh: data.cacheStats?.lastRefresh || new Date().toISOString()
          } 
        : null
    });
  }
};
