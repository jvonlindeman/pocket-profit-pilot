
import { useCallback, useState } from 'react';
import { Transaction, CategorySummary } from '@/types/financial';

// Constants for collaborator identification - improved to be more comprehensive
export const COLLABORATOR_IDENTIFIERS = [
  'colaborador', 
  'colaboradores',
  'pagos a colaboradores',
  'pago a colaborador',
  'collaborator',
  'collaborators'
];

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<CategorySummary[]>([]);

  // Check if a transaction is a collaborator expense
  const isCollaboratorExpense = useCallback((transaction: Transaction): boolean => {
    if (transaction.type !== 'expense') return false;
    
    const category = transaction.category?.toLowerCase() || '';
    const description = transaction.description?.toLowerCase() || '';
    
    return COLLABORATOR_IDENTIFIERS.some(identifier => 
      category.includes(identifier.toLowerCase()) || 
      description.includes(identifier.toLowerCase())
    );
  }, []);

  // Process and categorize collaborator data
  const processCollaboratorData = useCallback((transactions: Transaction[]) => {
    console.log("🔄 useCollaboratorProcessor: Starting collaborator processing", {
      totalTransactions: transactions.length
    });

    // Filter collaborator transactions
    const collaboratorTransactions = transactions.filter(isCollaboratorExpense);
    
    console.log("👥 useCollaboratorProcessor: Found collaborator transactions", {
      collaboratorCount: collaboratorTransactions.length,
      collaboratorTransactions: collaboratorTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        date: tx.date
      }))
    });

    // Group by category
    const groupedByCategory = collaboratorTransactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Colaboradores Sin Categoría';
      
      if (!acc[category]) {
        acc[category] = {
          category,
          amount: 0,
          percentage: 0,
          count: 0
        };
      }
      
      acc[category].amount += transaction.amount;
      acc[category].count = (acc[category].count || 0) + 1;
      return acc;
    }, {} as Record<string, CategorySummary & { count?: number }>);

    // Calculate total collaborator expenses
    const totalCollaboratorExpense = Object.values(groupedByCategory).reduce(
      (sum, cat) => sum + cat.amount, 0
    );

    console.log("💰 useCollaboratorProcessor: Total collaborator expense", {
      totalCollaboratorExpense,
      categoriesCount: Object.keys(groupedByCategory).length
    });

    // Calculate percentages and convert to array
    const collaboratorSummary = Object.values(groupedByCategory)
      .map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: totalCollaboratorExpense > 0 ? (item.amount / totalCollaboratorExpense) * 100 : 0,
        count: item.count,
        date: collaboratorTransactions.find(tx => 
          (tx.category || 'Colaboradores Sin Categoría') === item.category
        )?.date
      }))
      .sort((a, b) => b.amount - a.amount);

    console.log("📊 useCollaboratorProcessor: Final collaborator summary", {
      collaboratorSummary,
      totalAmount: totalCollaboratorExpense
    });

    setCollaboratorExpenses(collaboratorSummary);
    return collaboratorSummary;
  }, [isCollaboratorExpense]);

  return {
    collaboratorExpenses,
    processCollaboratorData,
    isCollaboratorExpense
  };
};
