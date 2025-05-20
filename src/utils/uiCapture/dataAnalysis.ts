
// Format amount for display
export function formatAmount(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Simple function to calculate transaction insights
export function calculateTransactionInsights(transactions: any[]) {
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
export function calculateMetricComparisons(financeContext: any) {
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
