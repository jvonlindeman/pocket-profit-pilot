
import { useCallback, useState } from 'react';
import { Transaction, CategorySummary } from '@/types/financial';

// EXPANDED collaborator identifiers - more comprehensive for Spanish and English
export const COLLABORATOR_IDENTIFIERS = [
  // Spanish identifiers
  'colaborador', 
  'colaboradores',
  'pagos a colaboradores',
  'pago a colaborador',
  'pago colaborador',
  'gastos colaboradores',
  'gasto colaborador',
  'honorarios',
  'freelancer',
  'freelancers',
  'contratista',
  'contratistas',
  'consultor',
  'consultores',
  'servicios profesionales',
  'servicios externos',
  'trabajo independiente',
  
  // English identifiers  
  'collaborator',
  'collaborators',
  'contractor',
  'contractors',
  'consultant',
  'consultants',
  'professional services',
  'external services',
  'independent work',
  'freelance',
  
  // Common patterns in Zoho Books
  'professional fees',
  'consulting fees',
  'service fees'
];

export const useCollaboratorProcessor = () => {
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<CategorySummary[]>([]);

  // Enhanced check if a transaction is a collaborator expense
  const isCollaboratorExpense = useCallback((transaction: Transaction): boolean => {
    if (transaction.type !== 'expense') return false;
    
    const category = transaction.category?.toLowerCase().trim() || '';
    const description = transaction.description?.toLowerCase().trim() || '';
    
    // More comprehensive matching
    const isCollaborator = COLLABORATOR_IDENTIFIERS.some(identifier => {
      const lowerIdentifier = identifier.toLowerCase();
      return category.includes(lowerIdentifier) || 
             description.includes(lowerIdentifier) ||
             category === lowerIdentifier ||
             description === lowerIdentifier;
    });

    // Enhanced logging for collaborator detection
    if (isCollaborator) {
      console.log("👥 COLLABORATOR DETECTED:", {
        id: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        source: transaction.source,
        date: transaction.date,
        matchedIdentifiers: COLLABORATOR_IDENTIFIERS.filter(id => {
          const lowerIdentifier = id.toLowerCase();
          return category.includes(lowerIdentifier) || description.includes(lowerIdentifier);
        })
      });
    } else {
      // Log non-collaborator expenses from Zoho for debugging
      if (transaction.source === 'Zoho' && transaction.type === 'expense') {
        console.log("❌ NON-COLLABORATOR ZOHO EXPENSE:", {
          id: transaction.id,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          source: transaction.source,
          date: transaction.date,
          reason: 'No matching collaborator identifiers found'
        });
      }
    }
    
    return isCollaborator;
  }, []);

  // Enhanced process and categorize collaborator data
  const processCollaboratorData = useCallback((transactions: Transaction[]) => {
    console.log("🔄 useCollaboratorProcessor: Starting ENHANCED collaborator processing", {
      totalTransactions: transactions.length,
      transactionSources: transactions.reduce((acc, tx) => {
        acc[tx.source] = (acc[tx.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      expenseTransactions: transactions.filter(tx => tx.type === 'expense').length,
      zohoExpenseTransactions: transactions.filter(tx => tx.type === 'expense' && tx.source === 'Zoho').length
    });

    // Filter collaborator transactions with enhanced logging
    const collaboratorTransactions = transactions.filter(transaction => {
      const isCollab = isCollaboratorExpense(transaction);
      return isCollab;
    });
    
    console.log("👥 useCollaboratorProcessor: ENHANCED collaborator filtering results", {
      totalTransactions: transactions.length,
      collaboratorCount: collaboratorTransactions.length,
      collaboratorTotal: collaboratorTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      nonCollaboratorExpenses: transactions.filter(tx => 
        tx.type === 'expense' && !isCollaboratorExpense(tx)
      ).length,
      zohoCollaboratorExpenses: collaboratorTransactions.filter(tx => tx.source === 'Zoho').length,
      stripeCollaboratorExpenses: collaboratorTransactions.filter(tx => tx.source === 'Stripe').length
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
        transactionId: transaction.id,
        transactionAmount: transaction.amount,
        newCategoryTotal: acc[category].amount,
        transactionCount: acc[category].count,
        source: transaction.source,
        date: transaction.date
      });
      
      return acc;
    }, {} as Record<string, CategorySummary & { count?: number }>);

    // Calculate total collaborator expenses
    const totalCollaboratorExpense = Object.values(groupedByCategory).reduce(
      (sum, cat) => sum + cat.amount, 0
    );

    console.log("💰 useCollaboratorProcessor: FINAL ENHANCED collaborator calculations", {
      totalCollaboratorExpense,
      categoriesCount: Object.keys(groupedByCategory).length,
      categories: Object.keys(groupedByCategory),
      categoryBreakdown: Object.values(groupedByCategory).map(cat => ({
        category: cat.category,
        amount: cat.amount,
        count: cat.count
      })),
      expectationCheck: totalCollaboratorExpense > 0 ? 'SUCCESS' : 'PROBLEM - SHOULD BE > 0'
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

    console.log("📊 useCollaboratorProcessor: FINAL ENHANCED collaborator summary", {
      collaboratorSummary: collaboratorSummary.map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: item.percentage,
        count: item.count
      })),
      totalAmount: totalCollaboratorExpense,
      status: totalCollaboratorExpense > 0 ? 'DATA_FOUND' : 'NO_DATA_FOUND'
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
