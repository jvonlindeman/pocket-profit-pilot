import { DEFAULT_FINANCIAL_DATA } from '@/constants/financialDefaults';
import { FinancialData } from '@/types/financial';
import { safeParseNumber } from '@/utils/financialUtils';
import { processTransactionsIntoFinancialData } from './financeDataProcessor';

/**
 * Interface for cache status information
 */
interface CacheStatus {
  usingCachedData: boolean;
  partialRefresh: boolean;
  stats: {
    cachedCount: number;
    newCount: number;
    isFresh: boolean;
  } | null;
}

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
  updateCacheStatus: (status: Partial<CacheStatus>) => void
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
  
  // Update summary with calculated values
  const updatedData = {
    ...data.financial_data,
    summary: {
      ...data.financial_data.summary,
      totalIncome: totalIncome,
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
const updateCacheStatusFromResponse = (data: any, updateCacheStatus: (status: Partial<CacheStatus>) => void): void => {
  if (data.fromCache || data.cached || data.partialRefresh) {
    updateCacheStatus({
      usingCachedData: Boolean(data.fromCache || data.cached),
      partialRefresh: Boolean(data.partialRefresh),
      stats: data.cacheStats || data.newTransactionsCount 
        ? { 
            cachedCount: data.cacheStats?.cachedCount || 0,
            newCount: data.newTransactionsCount || 0,
            isFresh: data.cacheStats?.isFresh || false
          } 
        : null
    });
  }
};
