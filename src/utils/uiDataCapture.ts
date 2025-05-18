
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
  
  console.log(`UI Interaction registered: ${action} on ${component}`);
};

/**
 * Registers a section as visible in the viewport
 */
export const registerVisibleSection = (sectionId: string) => {
  if (!visibleSections.includes(sectionId)) {
    visibleSections.push(sectionId);
    console.log(`Section now visible: ${sectionId}`);
  }
};

/**
 * Unregisters a section when it's no longer visible
 */
export const unregisterVisibleSection = (sectionId: string) => {
  const index = visibleSections.indexOf(sectionId);
  if (index !== -1) {
    visibleSections.splice(index, 1);
    console.log(`Section no longer visible: ${sectionId}`);
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
  
  // Look for recurring transactions (same amount, recurring periodicity)
  const amountGroups: Record<number, Transaction[]> = {};
  transactions.forEach(tx => {
    const amountKey = Math.round(tx.amount * 100);
    if (!amountGroups[amountKey]) amountGroups[amountKey] = [];
    amountGroups[amountKey].push(tx);
  });
  
  Object.entries(amountGroups)
    .filter(([_, txs]) => txs.length >= 2)
    .forEach(([amount, txs]) => {
      // Only consider as recurring if same description or category
      const descriptionGroups: Record<string, Transaction[]> = {};
      txs.forEach(tx => {
        const key = tx.description || tx.category || 'unknown';
        if (!descriptionGroups[key]) descriptionGroups[key] = [];
        descriptionGroups[key].push(tx);
      });
      
      Object.entries(descriptionGroups)
        .filter(([_, dtxs]) => dtxs.length >= 2)
        .forEach(([desc, dtxs]) => {
          insights.push({
            type: 'recurring',
            description: `Recurring ${dtxs[0].type}: ${desc} - $${dtxs[0].amount} appears ${dtxs.length} times`,
            significance: dtxs.length >= 3 ? 'high' : 'medium',
            relatedTransactions: dtxs
          });
        });
    });
  
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
  
  // Add income comparison if available
  if (financeContext?.summary?.totalIncome !== undefined && financeContext?.previousTotalIncome !== undefined) {
    const current = financeContext.summary.totalIncome;
    const previous = financeContext.previousTotalIncome;
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    
    comparisons.push({
      metricName: 'Total Income',
      currentValue: current,
      previousValue: previous,
      percentageChange: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    });
  }
  
  // Add expense comparison if available
  if (financeContext?.summary?.totalExpense !== undefined && financeContext?.previousTotalExpense !== undefined) {
    const current = financeContext.summary.totalExpense;
    const previous = financeContext.previousTotalExpense;
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    
    comparisons.push({
      metricName: 'Total Expenses',
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
 * Uses multiple selectors to increase chances of finding elements
 */
const detectActiveComponents = (): string[] => {
  const components: string[] = [];
  
  if (typeof window === 'undefined' || !window.document) {
    console.log('detectActiveComponents: Window or document not available');
    return components;
  }
  
  try {
    // Financial Summary component
    const summarySelectors = ['.financial-summary-section', '.financial-summary', '.summary-card-section'];
    for (const selector of summarySelectors) {
      if (document.querySelector(selector)) {
        components.push('financial-summary');
        break;
      }
    }
    
    // Transaction table/list
    const transactionSelectors = ['.transaction-table', '.transaction-list', '[data-component="transactions"]'];
    for (const selector of transactionSelectors) {
      if (document.querySelector(selector)) {
        components.push('transactions');
        break;
      }
    }
    
    // Income breakdown
    const incomeSelectors = ['.income-breakdown', '.income-tabs', '[data-component="income"]'];
    for (const selector of incomeSelectors) {
      if (document.querySelector(selector)) {
        components.push('income');
        break;
      }
    }
    
    // Expense analysis
    const expenseSelectors = ['.expense-analysis', '.expenses-section', '[data-component="expenses"]'];
    for (const selector of expenseSelectors) {
      if (document.querySelector(selector)) {
        components.push('expenses');
        break;
      }
    }
    
    // Financial History
    const historySelectors = ['.financial-history-summary', '.history-chart', '[data-component="history"]'];
    for (const selector of historySelectors) {
      if (document.querySelector(selector)) {
        components.push('financial-history');
        break;
      }
    }
    
    // Profit Section
    const profitSelectors = ['.profit-section', '[data-component="profit"]'];
    for (const selector of profitSelectors) {
      if (document.querySelector(selector)) {
        components.push('profit');
        break;
      }
    }
    
    // Financial Assistant Components
    if (document.querySelector('.financial-assistant-dialog') || document.querySelector('.financial-assistant-button')) {
      components.push('financial-assistant');
    }
    
    // General UI elements that might be visible
    if (document.querySelector('.date-range-picker')) {
      components.push('date-range-picker');
    }
    
    // Use data attributes as a fallback
    document.querySelectorAll('[data-component]').forEach(el => {
      const componentName = el.getAttribute('data-component');
      if (componentName && !components.includes(componentName)) {
        components.push(componentName);
      }
    });
    
    // Check for specific headings or text that might indicate component presence
    document.querySelectorAll('h1, h2, h3, .card-title').forEach(el => {
      const text = el.textContent?.toLowerCase() || '';
      if (text.includes('resumen') && !components.includes('financial-summary')) {
        components.push('financial-summary');
      } else if ((text.includes('transaccion') || text.includes('transacción')) && !components.includes('transactions')) {
        components.push('transactions');
      } else if (text.includes('ingreso') && !components.includes('income')) {
        components.push('income');
      } else if (text.includes('gasto') && !components.includes('expenses')) {
        components.push('expenses');
      } else if (text.includes('histor') && !components.includes('financial-history')) {
        components.push('financial-history');
      }
    });
    
    console.log('Active components detected:', components);
  } catch (error) {
    console.error('Error detecting active components:', error);
  }
  
  return components;
};

/**
 * Captures the current state of the financial UI data
 */
export const captureUIData = (financeContext: any): UIDataSnapshot => {
  console.log('Capturing UI data with finance context:', financeContext ? 
    `Context available (summary: ${Boolean(financeContext.summary)}, transactions: ${financeContext.transactions?.length || 0})` : 
    'No context available');
  
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
  
  // Detect and log what data is available for the assistant
  console.log('Financial data available for assistant:', {
    hasSummary: Boolean(financeContext.summary),
    transactionCount: transactions.length,
    collaboratorExpenseCount: financeContext.collaboratorExpenses?.length || 0,
    hasDateRange: Boolean(financeContext.dateRange?.startDate) && Boolean(financeContext.dateRange?.endDate),
    hasIncomeData: Boolean(financeContext.regularIncome) || Boolean(financeContext.stripeIncome),
    hasActiveComponents: detectActiveComponents().length > 0
  });
  
  // Create the data snapshot for the assistant
  const snapshot = {
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
  
  return snapshot;
};

/**
 * Optimizes the UI data for transmission by compressing and focusing on relevant data
 */
export const optimizeUIData = (data: UIDataSnapshot): UIDataSnapshot => {
  // Limit transactions to the most relevant ones:
  // - Include the 10 most recent
  // - Include any transactions related to insights
  // - Include any transactions of focused components
  
  console.log('Optimizing UI data for transmission, before:', {
    transactionCount: data.transactions.length,
    insightCount: data.transactionInsights.length
  });
  
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
  
  console.log('Optimized UI data, after:', {
    transactionCount: limitedTransactions.length,
    recentCount: recentTransactions.length,
    insightRelatedCount: insightTransactions.length
  });
  
  return {
    ...data,
    transactions: limitedTransactions
  };
};
