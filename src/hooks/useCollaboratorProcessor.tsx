
import { useCallback, useState } from 'react';
import { Transaction, CategorySummary } from '@/types/financial';

// Constants for collaborator identification - expanded to be more comprehensive
export const COLLABORATOR_IDENTIFIERS = [
  'colaborador', 
  'colaboradores',
  'pagos a colaboradores',
  'pago a colaborador',
  'pago colaborador',
  'collaborator',
  'collaborators',
  'freelancer',
  'freelancers',
  'contractor',
  'contractors'
];

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<CategorySummary[]>([]);

  // Check if a transaction is a collaborator expense
  const isCollaboratorExpense = useCallback((transaction: Transaction): boolean => {
    if (transaction.type !== 'expense') return false;
    
    const category = transaction.category?.toLowerCase() || '';
    const description = transaction.description?.toLowerCase() || '';
    
    const isCollaborator = COLLABORATOR_IDENTIFIERS.some(identifier => 
      category.includes(identifier.toLowerCase()) || 
      description.includes(identifier.toLowerCase())
    );

    // Debug logging for collaborator detection
    if (isCollaborator) {
      console.log("👥 COLLABORATOR DETECTED:", {
        id: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        source: transaction.source,
        matchedIdentifiers: COLLABORATOR_IDENTIFIERS.filter(id => 
          category.includes(id.toLowerCase()) || description.includes(id.toLowerCase())
        )
      });
    }
    
    return isCollaborator;
  }, []);

  // Process and categorize collaborator data
  const processCollaboratorData = useCallback((transactions: Transaction[]) => {
    console.log("🔄 useCollaboratorProcessor: Starting collaborator processing", {
      totalTransactions: transactions.length,
      transactionSources: transactions.reduce((acc, tx) => {
        acc[tx.source] = (acc[tx.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      expenseTransactions: transactions.filter(tx => tx.type === 'expense').length
    });

    // Filter collaborator transactions with detailed logging
    const collaboratorTransactions = transactions.filter(transaction => {
      const isCollab = isCollaboratorExpense(transaction);
      if (isCollab) {
        console.log("✅ COLLABORATOR TRANSACTION FOUND:", {
          id: transaction.id,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          source: transaction.source
        });
      }
      return isCollab;
    });
    
    console.log("👥 useCollaboratorProcessor: Collaborator filtering results", {
      totalTransactions: transactions.length,
      collaboratorCount: collaboratorTransactions.length,
      collaboratorTotal: collaboratorTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      nonCollaboratorExpenses: transactions.filter(tx => 
        tx.type === 'expense' && !isCollaboratorExpense(tx)
      ).length
    });

    // Group by category with enhanced logging
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
      
      console.log(`💰 Adding to category "${category}":`, {
        transactionAmount: transaction.amount,
        newCategoryTotal: acc[category].amount,
        transactionCount: acc[category].count
      });
      
      return acc;
    }, {} as Record<string, CategorySummary & { count?: number }>);

    // Calculate total collaborator expenses
    const totalCollaboratorExpense = Object.values(groupedByCategory).reduce(
      (sum, cat) => sum + cat.amount, 0
    );

    console.log("💰 useCollaboratorProcessor: Final collaborator calculations", {
      totalCollaboratorExpense,
      categoriesCount: Object.keys(groupedByCategory).length,
      categories: Object.keys(groupedByCategory),
      categoryBreakdown: Object.values(groupedByCategory).map(cat => ({
        category: cat.category,
        amount: cat.amount,
        count: cat.count
      }))
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
      collaboratorSummary: collaboratorSummary.map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: item.percentage,
        count: item.count
      })),
      totalAmount: totalCollaboratorExpense,
      expectedAmount: "Should be much higher than 0"
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
