
import { Transaction, FinancialData, CategorySummary, normalizeSummary } from '@/types/financial';

/**
 * Procesa los datos de transacciones y calcula métricas financieras
 */
export const processTransactionData = (
  transactions: Transaction[], 
  startingBalance: number = 0,
  collaboratorExpenses: CategorySummary[] = []
): FinancialData => {
  // Calculate total collaborator expense
  const totalCollaboratorExpense = collaboratorExpenses.reduce((sum, item) => sum + item.amount, 0);
  
  console.log("Processing transactions with collaborator expenses:", {
    transactionCount: transactions.length,
    totalCollaboratorExpense,
    collaboratorExpensesCount: collaboratorExpenses.length
  });
  
  // Process transactions as before
  const summary = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    collaboratorExpense: totalCollaboratorExpense,
    otherExpense: 0,
    profit: 0,
    profitMargin: 0,
    grossProfit: 0,
    grossProfitMargin: 0,
    startingBalance: startingBalance,
    netProfit: 0,
    transactionCount: transactions.length,
    incomeCount: transactions.filter(t => t.type === 'income').length,
    expenseCount: transactions.filter(t => t.type === 'expense').length,
    avgTransactionSize: transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
  };
  
  // Calculate other expense (total expense minus collaborator expense)
  summary.otherExpense = summary.totalExpenses - totalCollaboratorExpense;
  
  // Calculate profits
  summary.netProfit = summary.totalIncome - summary.totalExpenses;
  summary.profit = summary.startingBalance + summary.totalIncome - summary.totalExpenses;
  summary.profitMargin = summary.totalIncome > 0 ? (summary.profit / summary.totalIncome) * 100 : 0;
  summary.grossProfit = summary.totalIncome;
  summary.grossProfitMargin = summary.totalIncome > 0 ? 100 : 0;
  
  // Group expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = {
          category,
          amount: 0,
          percentage: 0
        };
      }
      acc[category].amount += transaction.amount;
      return acc;
    }, {} as Record<string, CategorySummary>);

  // Calculate percentages for each category
  const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.amount, 0);
  const expenseByCategory = Object.values(expensesByCategory).map(cat => {
    cat.percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
    return cat;
  }).sort((a, b) => b.amount - a.amount);
  
  // Group income by source
  const incomeBySource = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, transaction) => {
      const source = transaction.source || 'Sin fuente';
      if (!acc[source]) {
        acc[source] = {
          category: source,
          amount: 0,
          percentage: 0
        };
      }
      acc[source].amount += transaction.amount;
      return acc;
    }, {} as Record<string, CategorySummary>);

  // Calculate percentages for each source
  const totalIncome = Object.values(incomeBySource).reduce((sum, src) => sum + src.amount, 0);
  const incomeBySourceArray = Object.values(incomeBySource).map(src => {
    src.percentage = totalIncome > 0 ? (src.amount / totalIncome) * 100 : 0;
    return src;
  }).sort((a, b) => b.amount - a.amount);

  // Return enhanced financial data structure
  return {
    summary: normalizeSummary(summary),
    transactions,
    incomeBySource: incomeBySourceArray,
    expenseByCategory,
    dailyData: {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] }
    },
    monthlyData: {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] },
      profit: { labels: [], values: [] }
    }
  };
};
