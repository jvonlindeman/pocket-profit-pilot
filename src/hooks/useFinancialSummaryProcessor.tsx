
import { useMemo } from 'react';
import { Transaction, CategorySummary, FinancialData } from '@/types/financial';

export const useFinancialSummaryProcessor = (
  transactions: Transaction[],
  startingBalance: number = 0,
  collaboratorExpenses: CategorySummary[] = []
) => {
  // Process and summarize financial data consistently
  return useMemo(() => {
    console.log("useFinancialSummaryProcessor - Processing with collaborator expenses:", collaboratorExpenses);
    
    // Calculate total collaborator expense from the provided CategorySummary objects
    const totalCollaboratorExpense = collaboratorExpenses.reduce((sum, item) => {
      const amount = typeof item.amount === 'number' ? item.amount : 0;
      return sum + amount;
    }, 0);
    
    console.log("useFinancialSummaryProcessor - Calculated collaborator expense:", totalCollaboratorExpense);
    
    // Calculate income and expenses from transactions
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total expense from transactions
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate other expenses (total expenses minus collaborator expenses)
    const otherExpense = totalExpense - totalCollaboratorExpense;
    
    // Calculate profit metrics
    const profit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    const grossProfit = totalIncome;
    const grossProfitMargin = totalIncome > 0 ? 100 : 0;
    
    // Create financial summary
    const summary = {
      totalIncome,
      totalExpense,
      collaboratorExpense: totalCollaboratorExpense,
      otherExpense,
      profit,
      profitMargin,
      grossProfit,
      grossProfitMargin,
      startingBalance
    };
    
    console.log("useFinancialSummaryProcessor - Final summary:", summary);
    
    // Process income and expense data by category
    const incomeBySource: CategorySummary[] = [];
    const expenseByCategory: CategorySummary[] = [];
    
    // Group transactions by category for expense and income
    const expenseCategories: Record<string, {amount: number, count: number}> = {};
    const incomeCategories: Record<string, {amount: number, count: number}> = {};
    
    // Process transactions to categorize them
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      
      if (transaction.type === 'expense') {
        if (!expenseCategories[category]) {
          expenseCategories[category] = { amount: 0, count: 0 };
        }
        expenseCategories[category].amount += transaction.amount;
        expenseCategories[category].count += 1;
      } else {
        if (!incomeCategories[category]) {
          incomeCategories[category] = { amount: 0, count: 0 };
        }
        incomeCategories[category].amount += transaction.amount;
        incomeCategories[category].count += 1;
      }
    });
    
    // Convert expense categories to array
    Object.entries(expenseCategories).forEach(([category, data]) => {
      expenseByCategory.push({
        category,
        amount: data.amount,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
        count: data.count
      });
    });
    
    // Convert income categories to array
    Object.entries(incomeCategories).forEach(([category, data]) => {
      incomeBySource.push({
        category,
        amount: data.amount,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
        count: data.count
      });
    });
    
    // Sort categories by amount (highest first)
    expenseByCategory.sort((a, b) => b.amount - a.amount);
    incomeBySource.sort((a, b) => b.amount - a.amount);
    
    return {
      summary,
      incomeBySource,
      expenseByCategory
    };
  }, [transactions, startingBalance, collaboratorExpenses]);
};
