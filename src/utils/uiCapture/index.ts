
// Create and export captureUIData function
export const captureUIData = (financeContext: any) => {
  // Extract active components and financial data
  const activeComponents = document.querySelectorAll('[data-component]');
  const activeComponentNames = Array.from(activeComponents).map(
    el => (el as HTMLElement).dataset.component || ''
  ).filter(Boolean);
  
  // Determine currently focused element
  const focusedElement = document.activeElement ? 
    (document.activeElement as HTMLElement).dataset.component || null : null;
  
  // Return a structured object with UI and financial data
  return {
    activeComponents: activeComponentNames,
    focusedElement,
    summary: financeContext.summary,
    transactions: financeContext.transactions,
    collaboratorExpenses: financeContext.collaboratorExpenses,
    stripeIncome: financeContext.stripeIncome,
    regularIncome: financeContext.regularIncome,
    transactionInsights: [], // Will be filled by data analysis if needed
  };
};

// Import all the utility functions
import { calculateTransactionInsights } from './dataAnalysis';
import { optimizeUIData } from './dataOptimization';
import { registerInteraction } from './interactionStore';

// Define registerVisibleSection as a wrapper around registerInteraction
export const registerVisibleSection = (sectionName: string) => {
  registerInteraction('visible-section', 'view', { section: sectionName });
};

// Re-export everything
export {
  calculateTransactionInsights,
  optimizeUIData,
  registerInteraction
};
