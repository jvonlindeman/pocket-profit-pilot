import { FinancialData, Transaction, CategorySummary, UnpaidInvoice } from '@/types/financial';
import { getDOMElementsBySelector } from './domUtils';
import { analyzeFinancialData } from './dataAnalysis';
import { optimizeUIDataPayload } from './dataOptimization';
import { captureHistoricalFinancialData, HistoricalFinancialContext } from './historicalDataCapture';

// Store for user interactions
export const InteractionStore = {
  interactions: [] as Array<{
    component: string;
    action: string;
    timestamp: number;
    data?: any;
  }>,
  maxInteractions: 50,
};

/**
 * Register a user interaction with a component
 * @param component The component identifier
 * @param action The action performed (click, view, etc.)
 * @param data Optional data associated with the interaction
 */
export const registerInteraction = (
  component: string,
  action: string,
  data?: any
) => {
  // Add the interaction to the store
  InteractionStore.interactions.push({
    component,
    action,
    timestamp: Date.now(),
    data,
  });

  // Keep only the most recent interactions
  if (InteractionStore.interactions.length > InteractionStore.maxInteractions) {
    InteractionStore.interactions = InteractionStore.interactions.slice(
      InteractionStore.interactions.length - InteractionStore.maxInteractions
    );
  }

  // Log the interaction for debugging
  console.log(`Interaction: ${component} - ${action}`, data || '');
};

interface EnhancedUIData {
  // Existing fields
  activeComponents: string[];
  focusedElement: string | null;
  summary: any;
  transactions: Transaction[];
  transactionInsights: any[];
  collaboratorExpenses: CategorySummary[];
  unpaidInvoices: UnpaidInvoice[];
  regularIncome: number;
  stripeIncome: number;
  stripeFees: number;
  dateRange: any;
  
  // New historical data
  historicalContext: HistoricalFinancialContext | null;
  temporalAnalysisAvailable: boolean;
}

/**
 * Enhanced UI data capture with historical financial context
 */
export const captureUIData = async (financeContext: any): Promise<EnhancedUIData> => {
  console.log('Starting enhanced UI data capture with historical context...');
  
  // Capture existing UI data
  const activeComponents = getDOMElementsBySelector('[data-component]')
    .map((el: Element) => el.getAttribute('data-component'))
    .filter((comp): comp is string => comp !== null);

  const focusedElement = document.activeElement?.getAttribute('data-component') || null;

  // Extract financial data from context
  const summary = financeContext.summary || {};
  const transactions = financeContext.transactions || [];
  const collaboratorExpenses = financeContext.collaboratorExpenses || [];
  const unpaidInvoices = financeContext.unpaidInvoices || [];
  const regularIncome = financeContext.regularIncome || 0;
  const stripeIncome = financeContext.stripeIncome || 0;
  const stripeFees = financeContext.stripeFees || 0;
  const dateRange = financeContext.dateRange || {};

  // Analyze current financial data for insights
  const transactionInsights = analyzeFinancialData({
    summary,
    transactions,
    incomeBySource: [],
    expenseByCategory: [],
    dailyData: { income: { labels: [], values: [] }, expense: { labels: [], values: [] } },
    monthlyData: { 
      income: { labels: [], values: [] }, 
      expense: { labels: [], values: [] },
      profit: { labels: [], values: [] }
    }
  });

  // Capture historical financial context
  console.log('Fetching historical financial context...');
  const historicalContext = await captureHistoricalFinancialData(dateRange);
  const temporalAnalysisAvailable = historicalContext !== null && historicalContext.monthlyHistory.length > 0;

  const uiData: EnhancedUIData = {
    activeComponents,
    focusedElement,
    summary,
    transactions,
    transactionInsights,
    collaboratorExpenses,
    unpaidInvoices,
    regularIncome,
    stripeIncome,
    stripeFees,
    dateRange,
    historicalContext,
    temporalAnalysisAvailable
  };

  // Optimize the payload for AI consumption
  const optimizedData = optimizeUIDataPayload(uiData);

  console.log('Enhanced UI data capture completed:', {
    activeComponents: activeComponents.length,
    transactionCount: transactions.length,
    historicalMonths: historicalContext?.monthlyHistory.length || 0,
    temporalAnalysisAvailable
  });

  return optimizedData as EnhancedUIData;
};

/**
 * Get stored user interactions for context
 * @param limit Maximum number of interactions to return
 * @returns Recent user interactions
 */
export const getStoredInteractions = (limit = 10) => {
  return InteractionStore.interactions
    .slice(-limit)
    .map(({ component, action, timestamp, data }) => ({
      component,
      action,
      timestamp,
      data,
    }));
};
