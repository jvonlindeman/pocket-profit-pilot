import { interactionStore } from "./uiDataStore";

// Function to get active components in the UI
function getActiveComponents() {
  const components = [
    'dashboard',
    'transactions',
    'summary',
    'reports',
    'settings',
    'financial-assistant'
  ];
  
  return components.filter(component => {
    const element = document.querySelector(`[data-component="${component}"]`);
    return element !== null && element.offsetParent !== null; // offsetParent checks for visibility
  });
}

// Function to get visible sections in the UI
function getVisibleSections() {
  const sections = [
    'income',
    'expenses',
    'profit',
    'cashflow',
    'balance'
  ];
  
  return sections.filter(section => {
    const element = document.getElementById(section);
    return element !== null && element.offsetParent !== null;
  });
}

// Function to get the currently focused element
function getFocusedElement() {
  return document.activeElement ? document.activeElement.tagName : null;
}

// Function to register a UI interaction
export function registerInteraction(component: string, action: string, details: any = {}) {
  const interaction = {
    component,
    action,
    timestamp: new Date().toISOString(),
    details
  };
  
  interactionStore.push(interaction);
  console.log('UI Interaction Registered:', interaction);
}

// Function to capture UI data
export function captureUIData(financeContext: any) {
  try {
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

// Function to optimize UI data for transmission
export function optimizeUIData(uiData: any) {
  try {
    // Create a copy to avoid modifying the original
    const optimized = {...uiData};
    
    // Limit transaction data
    if (optimized.transactions && optimized.transactions.length > 15) {
      optimized.transactions = optimized.transactions.slice(0, 15);
    }
    
    // Only include necessary interaction history
    if (optimized.interactionHistory && optimized.interactionHistory.length > 10) {
      optimized.interactionHistory = optimized.interactionHistory.slice(0, 10);
    }
    
    // Remove any large or unnecessary fields
    if (optimized.rawData) delete optimized.rawData;
    
    return optimized;
  } catch (error) {
    console.error("Error optimizing UI data:", error);
    return uiData; // Return original if optimization fails
  }
}

// Simple function to calculate transaction insights
function calculateTransactionInsights(transactions: any[]) {
  if (!transactions || transactions.length === 0) return [];
  
  const insights = [];
  
  // Find largest transaction
  const largestTransaction = transactions.reduce((max, tx) => 
    Math.abs(tx.amount) > Math.abs(max.amount) ? tx : max, 
    { amount: 0 }
  );
  
  if (Math.abs(largestTransaction.amount) > 500) {
    insights.push({
      description: `Mayor transacción: ${largestTransaction.description} (${formatAmount(largestTransaction.amount)})`,
      significance: 'medium'
    });
  }
  
  // Group by category
  const categories: Record<string, number> = {};
  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    if (!categories[category]) categories[category] = 0;
    categories[category] += Math.abs(tx.amount);
  });
  
  // Find top category
  let topCategory = { name: '', amount: 0 };
  for (const [name, amount] of Object.entries(categories)) {
    if (amount > topCategory.amount) {
      topCategory = { name, amount };
    }
  }
  
  if (topCategory.name) {
    insights.push({
      description: `Categoría principal: ${topCategory.name} (${formatAmount(topCategory.amount)})`,
      significance: 'medium'
    });
  }
  
  return insights;
}

// Function to calculate metric comparisons
function calculateMetricComparisons(financeContext: any) {
  if (!financeContext?.financialData) return [];
  
  const comparisons = [];
  const currentData = financeContext.financialData;
  
  // Only add comparison if we have previous data
  if (currentData && financeContext.previousPeriodData) {
    const previous = financeContext.previousPeriodData;
    
    // Compare profit margins
    if (previous.profitMargin !== undefined && currentData.profitMargin !== undefined) {
      comparisons.push({
        metricName: 'Margen de beneficio',
        currentValue: currentData.profitMargin,
        previousValue: previous.profitMargin,
        percentageChange: currentData.profitMargin - previous.profitMargin
      });
    }
    
    // Compare total income
    if (previous.totalIncome !== undefined && currentData.totalIncome !== undefined) {
      const percentChange = ((currentData.totalIncome - previous.totalIncome) / Math.abs(previous.totalIncome)) * 100;
      
      comparisons.push({
        metricName: 'Ingresos totales',
        currentValue: currentData.totalIncome,
        previousValue: previous.totalIncome,
        percentageChange: percentChange
      });
    }
    
    // Compare total expenses
    if (previous.totalExpense !== undefined && currentData.totalExpense !== undefined) {
      const percentChange = ((currentData.totalExpense - previous.totalExpense) / Math.abs(previous.totalExpense)) * 100;
      
      comparisons.push({
        metricName: 'Gastos totales',
        currentValue: currentData.totalExpense,
        previousValue: previous.totalExpense,
        percentageChange: percentChange
      });
    }
  }
  
  return comparisons;
}

// Format amount for display
function formatAmount(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Get recent interactions from the store
function getRecentInteractions() {
  return interactionStore.slice(-10); // Get the 10 most recent interactions
}
