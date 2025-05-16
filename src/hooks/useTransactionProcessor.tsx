
import { useMemo } from 'react';
import { Transaction, CategorySummary } from '@/types/financial';

// Constants for category identification - updated to match both cases
export const COLLABORATOR_IDENTIFIERS = ['colaborador', 'pagos a colaboradores'];

interface TransactionSummary {
  byCategory: CategorySummary[];
  bySource: CategorySummary[];
  totalExpense: number;
  totalIncome: number;
}

export const useTransactionProcessor = (transactions: Transaction[]) => {
  // Process and filter transactions by category
  const processTransactions = (filterFn: (t: Transaction) => boolean): Transaction[] => {
    if (!transactions || transactions.length === 0) return [];
    return transactions.filter(filterFn);
  };

  // Get transactions by type
  const getByType = (type: 'income' | 'expense'): Transaction[] => {
    return processTransactions(t => t.type === type);
  };
  
  // Get collaborator expenses specifically - improved case-insensitive filtering
  const getCollaboratorExpenses = (): Transaction[] => {
    return processTransactions(t => 
      t.type === 'expense' && 
      COLLABORATOR_IDENTIFIERS.some(identifier => 
        t.category?.toLowerCase().includes(identifier.toLowerCase())
      )
    );
  };

  // Get expenses excluding collaborators - improved case-insensitive filtering
  const getNonCollaboratorExpenses = (): Transaction[] => {
    return processTransactions(t => 
      t.type === 'expense' && 
      !COLLABORATOR_IDENTIFIERS.some(identifier => 
        t.category?.toLowerCase().includes(identifier.toLowerCase())
      )
    );
  };

  // Get transactions from specific source
  const getBySource = (source: string): Transaction[] => {
    return processTransactions(t => t.source === source);
  };

  // Summarize transactions by category
  const categorySummary = useMemo((): TransactionSummary => {
    if (!transactions || transactions.length === 0) {
      return {
        byCategory: [],
        bySource: [],
        totalExpense: 0,
        totalIncome: 0
      };
    }

    // Determine if we're looking at collaborator expenses or regular expenses
    const isCollaboratorView = transactions.every(t => 
      t.type === 'expense' && 
      COLLABORATOR_IDENTIFIERS.some(identifier => 
        t.category?.toLowerCase().includes(identifier.toLowerCase())
      )
    );
    
    // For filtered views, use the transactions directly
    const expensesToUse = transactions.filter(t => t.type === 'expense');
    const incomesToUse = transactions.filter(t => t.type === 'income');

    // Group expenses by category
    const expensesByCategory = expensesToUse.reduce((acc, transaction) => {
      const category = transaction.category || 'Sin categoría';
      
      if (!acc[category]) {
        acc[category] = {
          category,
          amount: 0,
          percentage: 0,
          count: 0
        };
      }
      
      acc[category].amount += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, CategorySummary & { count?: number }>);
      
    // Group incomes by source
    const incomeBySource = incomesToUse.reduce((acc, transaction) => {
      const source = transaction.source || 'Sin fuente';
      
      if (!acc[source]) {
        acc[source] = {
          category: source,
          amount: 0,
          percentage: 0,
          count: 0
        };
      }
      
      acc[source].amount += transaction.amount;
      acc[source].count += 1;
      return acc;
    }, {} as Record<string, CategorySummary & { count?: number }>);
      
    // Calculate totals
    const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.amount, 0);
    const totalIncome = Object.values(incomeBySource).reduce((sum, src) => sum + src.amount, 0);
    
    // Calculate percentages and convert to array
    const expensesArray = Object.values(expensesByCategory)
      .map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
        count: item.count
      }))
      .sort((a, b) => b.amount - a.amount);
    
    const incomeArray = Object.values(incomeBySource)
      .map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0,
        count: item.count
      }))
      .sort((a, b) => b.amount - a.amount);
    
    return {
      byCategory: expensesArray,
      bySource: incomeArray,
      totalExpense: totalExpenses,
      totalIncome: totalIncome
    };
  }, [transactions]);

  return {
    getByType,
    getCollaboratorExpenses,
    getNonCollaboratorExpenses,
    getBySource,
    categorySummary
  };
};
