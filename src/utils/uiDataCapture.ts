
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
}

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
      activeComponents: []
    };
  }
  
  return {
    summary: financeContext.summary || null,
    transactions: financeContext.transactions || [],
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
    activeComponents: detectActiveComponents()
  };
};

/**
 * Detects which components are currently active/visible in the UI
 */
const detectActiveComponents = (): string[] => {
  const components: string[] = [];
  
  // This could be enhanced to actually detect components in the DOM
  // For now returning an empty array
  
  return components;
};

/**
 * Optimizes the UI data for transmission by compressing and focusing on relevant data
 */
export const optimizeUIData = (data: UIDataSnapshot): UIDataSnapshot => {
  // Limit transactions to a reasonable number (e.g., 20 most recent)
  const limitedTransactions = data.transactions.slice(0, 20);
  
  return {
    ...data,
    transactions: limitedTransactions
  };
};
