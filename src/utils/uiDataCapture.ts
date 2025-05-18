import { FinancialSummary, Transaction, CategorySummary } from '@/types/financial';

/**
 * Data structure representing all UI data relevant for the financial assistant
 */
export interface UIDataSnapshot {
  // Core financial data
  summary: FinancialSummary | null;
  transactions: Transaction[];
  collaboratorExpenses: CategorySummary[];
  
  // Income data
  regularIncome: number;
  stripeIncome: number;
  stripeFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  
  // Date range
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  
  // Monthly balance data
  startingBalance: number;
  
  // Additional metrics
  profitMargin: number;
  
  // Component specific data
  activeComponents: string[];
  
  // UI state awareness
  visibleSections: string[];
  focusedElement: string | null;
  interactionHistory: UIInteraction[];
  currentMetricComparisons: MetricComparison[];
  
  // Analysis hints
  transactionInsights: TransactionInsight[];
}

/**
 * Records user interactions with the UI
 */
interface UIInteraction {
  component: string;
  action: 'click' | 'hover' | 'select' | 'filter';
  timestamp: string;
  value?: any;
}

/**
 * Comparison of a metric with a previous period
 */
interface MetricComparison {
  metricName: string;
  currentValue: number;
  previousValue: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Insight about transaction patterns
 */
interface TransactionInsight {
  type: 'anomaly' | 'trend' | 'recurring' | 'category';
  description: string;
  significance: 'high' | 'medium' | 'low';
  relatedTransactions?: Transaction[];
}

// Track focused elements for improved context awareness
let currentFocusedElement: string | null = null;
const interactionHistory: UIInteraction[] = [];
const visibleSections: string[] = [];

/**
 * Registers a UI interaction to build context
 */
export const registerInteraction = (component: string, action: 'click' | 'hover' | 'select' | 'filter', value?: any) => {
  const interaction: UIInteraction = {
    component,
    action,
    timestamp: new Date().toISOString(),
    value
  };
  
  // Keep last 10 interactions
  interactionHistory.unshift(interaction);
  if (interactionHistory.length > 10) {
    interactionHistory.pop();
  }
  
  // Update focused element
  if (action === 'click' || action === 'select') {
    currentFocusedElement = component;
  }
};

/**
 * Registers a section as visible in the viewport
 */
export const registerVisibleSection = (sectionId: string) => {
  if (!visibleSections.includes(sectionId)) {
    visibleSections.push(sectionId);
  }
};

/**
 * Unregisters a section when it's no longer visible
 */
export const unregisterVisibleSection = (sectionId: string) => {
  const index = visibleSections.indexOf(sectionId);
  if (index !== -1) {
    visibleSections.splice(index, 1);
  }
};

/**
 * Analyzes transactions to extract meaningful insights
 */
const analyzeTransactions = (transactions: Transaction[]): TransactionInsight[] => {
  const insights: TransactionInsight[] = [];
  
  if (!transactions.length) return insights;
  
  // Find largest expense
  const largestExpense = [...transactions]
    .filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)[0];
  
  if (largestExpense) {
    insights.push({
      type: 'anomaly',
      description: `Largest expense of $${largestExpense.amount} for ${largestExpense.description || 'undescribed item'}`,
      significance: 'medium',
      relatedTransactions: [largestExpense]
    });
  }
  
  // Group by category and find dominant categories
  const categoryMap: Record<string, Transaction[]> = {};
  
  transactions.forEach(t => {
    const category = t.category || 'Uncategorized';
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push(t);
  });
  
  // Find categories with most transactions
  const categoriesByCount = Object.entries(categoryMap)
    .map(([category, txs]) => ({ category, count: txs.length, total: txs.reduce((sum, t) => sum + t.amount, 0) }))
    .sort((a, b) => b.count - a.count);
  
  if (categoriesByCount.length > 0) {
    const topCategory = categoriesByCount[0];
    insights.push({
      type: 'category',
      description: `Most frequent category: ${topCategory.category} with ${topCategory.count} transactions totaling $${topCategory.total.toFixed(2)}`,
      significance: 'high'
    });
  }
  
  return insights;
};

/**
 * Generates metric comparisons based on available data
 */
const generateComparisons = (financeContext: any): MetricComparison[] => {
  const comparisons: MetricComparison[] = [];
  
  // Only add comparisons if we have data to compare
  if (financeContext?.summary?.profitMargin !== undefined && financeContext?.previousProfitMargin !== undefined) {
    const current = financeContext.summary.profitMargin;
    const previous = financeContext.previousProfitMargin;
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    
    comparisons.push({
      metricName: 'Profit Margin',
      currentValue: current,
      previousValue: previous,
      percentageChange: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    });
  }
  
  return comparisons;
};

/**
 * Detects which components are currently active/visible in the UI
 */
const detectActiveComponents = (): string[] => {
  const components: string[] = [];
  
  // Try to detect components in the DOM
  if (typeof window !== 'undefined' && window.document) {
    // Financial Summary components
    if (document.querySelector('.financial-summary-section')) {
      components.push('financial-summary');
    }
    
    // Transaction table
    if (document.querySelector('.transaction-table')) {
      components.push('transaction-table');
    }
    
    // Income breakdown
    if (document.querySelector('.income-breakdown')) {
      components.push('income-breakdown');
    }
    
    // Expense analysis
    if (document.querySelector('.expense-analysis')) {
      components.push('expense-analysis');
    }
    
    // Financial History
    if (document.querySelector('.financial-history-summary')) {
      components.push('financial-history');
    }
  }
  
  return components;
};

/**
 * Captures the current state of the financial UI data
 */
export const captureUIData = (financeContext: any): UIDataSnapshot => {
  if (!financeContext) {
    return {
      summary: null,
      transactions: [],
      collaboratorExpenses: [],
      regularIncome: 0,
      stripeIncome: 0,
      stripeFees: 0,
      stripeNet: 0,
      stripeFeePercentage: 0,
      dateRange: {
        startDate: null,
        endDate: null
      },
      startingBalance: 0,
      profitMargin: 0,
      activeComponents: detectActiveComponents(),
      visibleSections: [...visibleSections],
      focusedElement: currentFocusedElement,
      interactionHistory: [...interactionHistory],
      currentMetricComparisons: [],
      transactionInsights: []
    };
  }
  
  const transactions = financeContext.transactions || [];
  
  return {
    summary: financeContext.summary || null,
    transactions: transactions,
    collaboratorExpenses: financeContext.collaboratorExpenses || [],
    regularIncome: financeContext.regularIncome || 0,
    stripeIncome: financeContext.stripeIncome || 0,
    stripeFees: financeContext.stripeFees || 0,
    stripeNet: financeContext.stripeNet || 0,
    stripeFeePercentage: financeContext.stripeFeePercentage || 0,
    dateRange: {
      startDate: financeContext.dateRange?.startDate ? financeContext.dateRange.startDate.toISOString() : null,
      endDate: financeContext.dateRange?.endDate ? financeContext.dateRange.endDate.toISOString() : null
    },
    startingBalance: financeContext.summary?.startingBalance || 0,
    profitMargin: financeContext.summary?.profitMargin || 0,
    activeComponents: detectActiveComponents(),
    visibleSections: [...visibleSections],
    focusedElement: currentFocusedElement,
    interactionHistory: [...interactionHistory],
    currentMetricComparisons: generateComparisons(financeContext),
    transactionInsights: analyzeTransactions(transactions)
  };
};

/**
 * Optimizes the UI data for transmission by compressing and focusing on relevant data
 */
export const optimizeUIData = (data: UIDataSnapshot): UIDataSnapshot => {
  // Limit transactions to the most relevant ones:
  // - Include the 10 most recent
  // - Include any transactions related to insights
  // - Include any transactions of focused components
  
  const insightRelatedTxIds = new Set<string>();
  data.transactionInsights.forEach(insight => {
    insight.relatedTransactions?.forEach(tx => {
      insightRelatedTxIds.add(tx.id || '');
    });
  });
  
  // Get the most recent transactions
  const recentTransactions = [...data.transactions].sort((a, b) => {
    const dateA = new Date(a.date || '');
    const dateB = new Date(b.date || '');
    return dateB.getTime() - dateA.getTime();
  }).slice(0, 10);
  
  // Add insight-related transactions if they weren't already in the recent ones
  const insightTransactions = data.transactions.filter(tx => 
    insightRelatedTxIds.has(tx.id || '') && 
    !recentTransactions.some(rt => rt.id === tx.id)
  );
  
  // Combine and limit to 20 max
  const limitedTransactions = [...recentTransactions, ...insightTransactions]
    .slice(0, 20);
  
  return {
    ...data,
    transactions: limitedTransactions
  };
};
