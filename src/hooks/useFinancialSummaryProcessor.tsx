import { useMemo } from 'react';
import { Transaction, CategorySummary, FinancialData } from '@/types/financial';
import { isCollaboratorExpense, validateFinancialValue } from '@/utils/financialUtils';

/**
 * A hook that processes financial data and provides consistent calculations
 * This hook serves as the single source of truth for financial calculations
 */
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
      const amount = validateFinancialValue(item.amount);
      console.log(`Processing collaborator expense: ${item.category || 'unnamed'} - $${amount}`);
      return sum + amount;
    }, 0);
    
    console.log("useFinancialSummaryProcessor - Calculated collaborator expense:", totalCollaboratorExpense);
    
    // Calculate income and expenses from transactions
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + validateFinancialValue(t.amount), 0);
    
    // Calculate total expense from transactions
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + validateFinancialValue(t.amount), 0);
    
    // Calculate collaborator expenses from transactions if no specific collaborator expenses provided
    let collaboratorExpenseFromTransactions = 0;
    if (collaboratorExpenses.length === 0) {
      collaboratorExpenseFromTransactions = transactions
        .filter(t => t.type === 'expense' && isCollaboratorExpense(t.category))
        .reduce((sum, t) => sum + validateFinancialValue(t.amount), 0);
        
      console.log("useFinancialSummaryProcessor - Calculated collaborator expense from transactions:", 
        collaboratorExpenseFromTransactions);
    }
    
    // Use either the provided collaborator expenses or calculated from transactions
    const finalCollaboratorExpense = collaboratorExpenses.length > 0 
      ? totalCollaboratorExpense 
      : collaboratorExpenseFromTransactions;
    
    // Calculate other expenses (total expenses minus collaborator expenses)
    const otherExpense = totalExpense - finalCollaboratorExpense;
    
    // Calculate profit metrics
    const profit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    
    // FIXED: Gross profit should be total income minus all expenses
    const grossProfit = totalIncome - totalExpense;
    const grossProfitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
    
    // Create financial summary
    const summary = {
      totalIncome,
      totalExpense,
      collaboratorExpense: finalCollaboratorExpense,
      otherExpense,
      profit,
      profitMargin,
      grossProfit,
      grossProfitMargin,
      startingBalance: validateFinancialValue(startingBalance)
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
      const amount = validateFinancialValue(transaction.amount);
      
      if (transaction.type === 'expense') {
        if (!expenseCategories[category]) {
          expenseCategories[category] = { amount: 0, count: 0 };
        }
        expenseCategories[category].amount += amount;
        expenseCategories[category].count += 1;
      } else {
        if (!incomeCategories[category]) {
          incomeCategories[category] = { amount: 0, count: 0 };
        }
        incomeCategories[category].amount += amount;
        incomeCategories[category].count += 1;
      }
    });
    
    // Convert expense categories to array with proper validation
    Object.entries(expenseCategories).forEach(([category, data]) => {
      expenseByCategory.push({
        category,
        amount: data.amount,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
        count: data.count
      });
    });
    
    // Convert income categories to array with proper validation
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
