
// Re-export all functionality from the separate modules
export { 
  interactionStore, 
  registerInteraction,
  getRecentInteractions 
} from './interactionStore';

export {
  getActiveComponents,
  getVisibleSections,
  registerVisibleSection,
  getFocusedElement
} from './domUtils';

export {
  calculateTransactionInsights,
  calculateMetricComparisons,
  formatAmount
} from './dataAnalysis';

export {
  optimizeUIData
} from './dataOptimization';

// Main function to capture UI data
export function captureUIData(financeContext: any) {
  try {
    const { 
      getActiveComponents,
      getVisibleSections,
      getFocusedElement,
    } = require('./domUtils');
    
    const {
      calculateTransactionInsights,
      calculateMetricComparisons,
    } = require('./dataAnalysis');
    
    const {
      getRecentInteractions
    } = require('./interactionStore');
    
    // Get active components from DOM
    const activeComponents = getActiveComponents();
    
    // Get currently visible sections
    const visibleSections = getVisibleSections();
    
    // Get currently focused element
    const focusedElement = getFocusedElement();
    
    // Get financial summary from context
    const summary = financeContext?.financialData || null;
    
    // Get recent transactions (limit to 20 for performance)
    const transactions = financeContext?.rawResponse?.slice(0, 20) || [];
    
    // Get collaborator expenses
    const collaboratorExpenses = financeContext?.collaboratorExpenses || [];
    
    // Gather income data
    const regularIncome = financeContext?.regularIncome || 0;
    const stripeIncome = financeContext?.stripeIncome || 0;
    const stripeFees = financeContext?.stripeFees || 0;
    const stripeNet = financeContext?.stripeNet || 0;
    const stripeFeePercentage = financeContext?.stripeFeePercentage || 0;
    
    // Get cache status
    const cacheStatus = {
      usingCached: financeContext?.usingCachedData || false,
      sources: ['Zoho', 'Stripe'].filter(source => 
        financeContext?.cacheStatus?.[source.toLowerCase()]?.cached
      ),
    };
    
    // Calculate simple transaction insights
    const transactionInsights = calculateTransactionInsights(transactions);
    
    // Calculate metric comparisons
    const currentMetricComparisons = calculateMetricComparisons(financeContext);
    
    // Return all UI data
    return {
      activeComponents,
      visibleSections,
      focusedElement,
      summary,
      transactions,
      collaboratorExpenses,
      regularIncome,
      stripeIncome,
      stripeFees,
      stripeNet,
      stripeFeePercentage,
      cacheStatus,
      transactionInsights,
      currentMetricComparisons,
      dateRange: financeContext?.dateRange,
      interactionHistory: getRecentInteractions()
    };
  } catch (error) {
    console.error("Error capturing UI data:", error);
    return {
      error: "Failed to capture UI data",
      activeComponents: []
    };
  }
}
