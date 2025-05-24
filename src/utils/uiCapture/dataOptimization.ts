import { HistoricalFinancialContext } from './historicalDataCapture';

/**
 * Optimize summary data for AI consumption
 */
export const optimizeSummaryData = (summary: any): any => {
  if (!summary) return {};
  
  return {
    totalIncome: summary.totalIncome || 0,
    totalExpense: summary.totalExpense || 0,
    collaboratorExpense: summary.collaboratorExpense || 0,
    otherExpense: summary.otherExpense || 0,
    profit: summary.profit || 0,
    profitMargin: summary.profitMargin || 0,
    startingBalance: summary.startingBalance || 0
  };
};

/**
 * Optimize transaction data for AI consumption
 */
export const optimizeTransactionData = (transactions: any[]): any[] => {
  if (!transactions || !transactions.length) return [];
  
  // If there are too many transactions, sample them
  const maxTransactions = 100;
  let optimizedTransactions = transactions;
  
  if (transactions.length > maxTransactions) {
    // Take a representative sample
    const samplingRate = Math.ceil(transactions.length / maxTransactions);
    optimizedTransactions = transactions.filter((_, index) => index % samplingRate === 0);
    
    // Ensure we include some recent transactions
    const recentTransactions = transactions.slice(-10);
    optimizedTransactions = [...optimizedTransactions, ...recentTransactions]
      .filter((tx, index, self) => 
        index === self.findIndex(t => t.id === tx.id)
      );
  }
  
  return optimizedTransactions.map(tx => ({
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    description: tx.description,
    category: tx.category,
    type: tx.type,
    source: tx.source
  }));
};

/**
 * Optimize insight data for AI consumption
 */
export const optimizeInsightData = (insights: any[]): any[] => {
  if (!insights || !insights.length) return [];
  
  // Keep only the most relevant insights
  return insights.slice(0, 10);
};

/**
 * Optimize collaborator data for AI consumption
 */
export const optimizeCollaboratorData = (collaborators: any[]): any[] => {
  if (!collaborators || !collaborators.length) return [];
  
  return collaborators.map(collab => ({
    name: collab.name || collab.category,
    amount: collab.amount,
    percentage: collab.percentage
  }));
};

/**
 * Optimize unpaid invoices data for AI consumption
 */
export const optimizeUnpaidInvoices = (invoices: any[]): any[] => {
  if (!invoices || !invoices.length) return [];
  
  return invoices.map(invoice => ({
    customer: invoice.customer_name || invoice.company_name,
    balance: invoice.balance
  }));
};

/**
 * Enhanced optimization including historical data
 */
export const optimizeUIDataPayload = (uiData: any): any => {
  const optimized = {
    // Existing optimization
    activeComponents: uiData.activeComponents || [],
    focusedElement: uiData.focusedElement,
    
    // Current period financial data (keep existing optimization)
    summary: optimizeSummaryData(uiData.summary),
    transactions: optimizeTransactionData(uiData.transactions),
    transactionInsights: optimizeInsightData(uiData.transactionInsights),
    collaboratorExpenses: optimizeCollaboratorData(uiData.collaboratorExpenses),
    unpaidInvoices: optimizeUnpaidInvoices(uiData.unpaidInvoices),
    
    // Income and fees data
    regularIncome: uiData.regularIncome || 0,
    stripeIncome: uiData.stripeIncome || 0,
    stripeFees: uiData.stripeFees || 0,
    
    // Date range
    dateRange: uiData.dateRange,
    
    // New: Historical context optimization
    historicalContext: optimizeHistoricalContext(uiData.historicalContext),
    temporalAnalysisAvailable: uiData.temporalAnalysisAvailable || false
  };

  // Log optimization results
  console.log('Data payload optimized:', {
    transactions: `${uiData.transactions?.length || 0} -> ${optimized.transactions?.length || 0}`,
    historicalMonths: optimized.historicalContext?.monthlyHistory?.length || 0,
    payloadSizeEstimate: `${JSON.stringify(optimized).length} chars`
  });

  return optimized;
};

/**
 * Optimize historical context for AI consumption
 */
function optimizeHistoricalContext(historicalContext: HistoricalFinancialContext | null): any {
  if (!historicalContext) {
    return null;
  }

  return {
    monthlyHistory: historicalContext.monthlyHistory.map(month => ({
      year: month.year,
      month: month.month,
      total_income: Number(month.total_income),
      total_expense: Number(month.total_expense),
      profit: Number(month.profit),
      profit_margin: Number(month.profit_margin),
      transaction_count: month.transaction_count,
      mom_income_change: month.mom_income_change ? Number(month.mom_income_change) : null,
      mom_expense_change: month.mom_expense_change ? Number(month.mom_expense_change) : null,
      mom_profit_change: month.mom_profit_change ? Number(month.mom_profit_change) : null,
      income_trend: month.income_trend,
      expense_trend: month.expense_trend,
      profit_trend: month.profit_trend
    })),
    currentPeriod: historicalContext.currentPeriod,
    trends: {
      overallIncomesTrend: historicalContext.trends.overallIncomesTrend,
      overallExpensesTrend: historicalContext.trends.overallExpensesTrend,
      overallProfitTrend: historicalContext.trends.overallProfitTrend,
      volatility: Math.round(historicalContext.trends.volatility * 100) / 100
    },
    seasonalPatterns: {
      highestIncomeMonth: historicalContext.seasonalPatterns.highestIncomeMonth,
      lowestIncomeMonth: historicalContext.seasonalPatterns.lowestIncomeMonth,
      highestExpenseMonth: historicalContext.seasonalPatterns.highestExpenseMonth,
      lowestExpenseMonth: historicalContext.seasonalPatterns.lowestExpenseMonth,
      averageMonthlyProfit: Math.round(historicalContext.seasonalPatterns.averageMonthlyProfit * 100) / 100
    }
  };
}
