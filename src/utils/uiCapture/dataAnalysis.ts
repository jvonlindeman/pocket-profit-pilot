
import { FinancialData } from '@/types/financial';

// Format amount for display
export function formatAmount(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Main export function that was missing
export function analyzeFinancialData(financialData: FinancialData) {
  const insights = [];
  
  // Basic analysis from the summary
  if (financialData.summary) {
    if (financialData.summary.profitMargin < 10) {
      insights.push({
        description: `Margen de beneficio bajo: ${financialData.summary.profitMargin.toFixed(1)}%`,
        significance: 'warning'
      });
    }
    
    if (financialData.summary.profit < 0) {
      insights.push({
        description: `Pérdidas este período: ${formatAmount(financialData.summary.profit)}`,
        significance: 'warning'
      });
    }
  }
  
  // Transaction-based insights
  if (financialData.transactions && financialData.transactions.length > 0) {
    const transactionInsights = calculateTransactionInsights(financialData.transactions);
    insights.push(...transactionInsights);
  }
  
  return insights;
}

// Enhanced function to calculate transaction insights with more sophisticated analysis
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
  const categoryCounts: Record<string, number> = {};
  transactions.forEach(tx => {
    const category = tx.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = 0;
      categoryCounts[category] = 0;
    }
    categories[category] += Math.abs(tx.amount);
    categoryCounts[category] += 1;
  });
  
  // Find top category
  let topCategory = { name: '', amount: 0, count: 0 };
  for (const [name, amount] of Object.entries(categories)) {
    if (amount > topCategory.amount) {
      topCategory = { name, amount, count: categoryCounts[name] };
    }
  }
  
  if (topCategory.name) {
    insights.push({
      description: `Categoría principal: ${topCategory.name} (${formatAmount(topCategory.amount)}, ${topCategory.count} transacciones)`,
      significance: 'medium'
    });
  }
  
  // Calculate recent trends (past 30 days vs previous 30 days)
  if (transactions.length >= 10) {
    // Sort by date
    const sortedTransactions = [...transactions]
      .filter(tx => tx.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedTransactions.length >= 10) {
      // Split into recent and previous
      const recent = sortedTransactions.slice(0, Math.floor(sortedTransactions.length / 2));
      const previous = sortedTransactions.slice(Math.floor(sortedTransactions.length / 2));
      
      // Calculate total expenses for each period
      const recentExpenses = recent.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const previousExpenses = previous.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      // Calculate change
      if (previousExpenses > 0) {
        const percentChange = ((recentExpenses - previousExpenses) / previousExpenses) * 100;
        
        if (Math.abs(percentChange) > 15) {  // Significant change
          insights.push({
            description: `Los gastos recientes ${percentChange > 0 ? 'aumentaron' : 'disminuyeron'} un ${Math.abs(percentChange).toFixed(1)}% comparado con el período anterior.`,
            significance: percentChange > 0 ? 'warning' : 'positive'
          });
        }
      }
    }
  }
  
  // Find frequency patterns
  if (transactions.length >= 15) {
    // Group transactions by day of month
    const dayFrequency: Record<number, number> = {};
    
    transactions.forEach(tx => {
      if (tx.date) {
        const date = new Date(tx.date);
        const day = date.getDate();
        if (!dayFrequency[day]) {
          dayFrequency[day] = 0;
        }
        dayFrequency[day] += 1;
      }
    });
    
    // Find days with high transaction frequency
    const highFrequencyDays = Object.entries(dayFrequency)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 2);
    
    if (highFrequencyDays.length > 0) {
      insights.push({
        description: `Días del mes con mayor actividad: ${highFrequencyDays.map(([day, count]) => `día ${day} (${count} transacciones)`).join(', ')}`,
        significance: 'low'
      });
    }
  }
  
  return insights;
}

// Enhanced function to calculate metric comparisons
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
    
    // Compare collaborator expenses
    if (previous.collaboratorExpense !== undefined && currentData.collaboratorExpense !== undefined) {
      const percentChange = ((currentData.collaboratorExpense - previous.collaboratorExpense) / Math.abs(previous.collaboratorExpense)) * 100;
      
      comparisons.push({
        metricName: 'Gastos de colaboradores',
        currentValue: currentData.collaboratorExpense,
        previousValue: previous.collaboratorExpense,
        percentageChange: percentChange
      });
    }
  }
  
  return comparisons;
}

// Calculate growth rate between two periods
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// Calculate average from array of numbers
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

// Calculate standard deviation
export function calculateStandardDeviation(numbers: number[]): number {
  const avg = calculateAverage(numbers);
  if (numbers.length <= 1) return 0;
  
  const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
  const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / (numbers.length - 1);
  
  return Math.sqrt(variance);
}
