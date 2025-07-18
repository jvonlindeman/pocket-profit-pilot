import React, { useEffect } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useIsMobile } from '@/hooks/use-mobile';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary, 
    transactions
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  const isMobile = useIsMobile();

  // FIXED: Calculate collaborator expenses directly from transactions with 'Pagos a colaboradores' category
  // This uses the collaborators that come properly separated from the Zoho endpoint
  const collaboratorTransactions = transactions?.filter(tx => 
    tx.type === 'expense' && 
    tx.category === 'Pagos a colaboradores'
  ) || [];
  
  const totalCollaboratorExpense = collaboratorTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate "Otros Gastos" as all other expenses (excluding collaborators)
  const otherExpenseTransactions = transactions?.filter(tx => 
    tx.type === 'expense' && 
    tx.category !== 'Pagos a colaboradores'
  ) || [];
  
  const otherExpense = otherExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Total expenses should be the sum of collaborators + others
  const calculatedTotalExpense = totalCollaboratorExpense + otherExpense;

  // Add detailed debugging for the fixed calculation
  useEffect(() => {
    const allExpenseTransactions = transactions?.filter(tx => tx.type === 'expense') || [];
    const totalFromAllExpenses = allExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log("🔍 RefinedExpensesSection - FIXED EXPENSE CALCULATION:", {
      // Raw transaction data
      totalTransactions: transactions?.length || 0,
      allExpenseTransactions: allExpenseTransactions.length,
      totalFromAllExpenses,
      
      // Collaborator calculation (from endpoint)
      collaboratorTransactions: collaboratorTransactions.length,
      collaboratorTransactionDetails: collaboratorTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        category: tx.category,
        description: tx.description
      })),
      totalCollaboratorExpense,
      
      // Other expenses calculation
      otherExpenseTransactions: otherExpenseTransactions.length,
      otherExpenseCategories: [...new Set(otherExpenseTransactions.map(tx => tx.category))],
      otherExpense,
      
      // Mathematical validation
      calculatedTotalExpense,
      summaryTotalExpense: summary.totalExpense,
      difference: calculatedTotalExpense - summary.totalExpense,
      isConsistent: Math.abs(calculatedTotalExpense - summary.totalExpense) < 0.01,
      
      // Verification
      verification: {
        collaboratorsFromEndpoint: totalCollaboratorExpense,
        otherExpensesCalculated: otherExpense,
        sum: totalCollaboratorExpense + otherExpense,
        matchesTotalExpenses: Math.abs((totalCollaboratorExpense + otherExpense) - totalFromAllExpenses) < 0.01
      }
    });

    // Log collaborator transactions breakdown
    if (collaboratorTransactions.length > 0) {
      console.log("👥 COLLABORATOR TRANSACTIONS FROM ENDPOINT:");
      collaboratorTransactions.forEach(tx => {
        console.log(`  - ${tx.description}: $${tx.amount} (${tx.category})`);
      });
    }

    // Log other expense categories
    if (otherExpenseTransactions.length > 0) {
      console.log("💰 OTHER EXPENSE CATEGORIES:");
      const categoryTotals = otherExpenseTransactions.reduce((acc, tx) => {
        const category = tx.category || 'Sin categoría';
        acc[category] = (acc[category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(categoryTotals).forEach(([category, total]) => {
        console.log(`  - ${category}: $${total}`);
      });
    }

  }, [transactions, collaboratorTransactions, otherExpenseTransactions, totalCollaboratorExpense, otherExpense, calculatedTotalExpense, summary]);

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
      {/* Collaborator Expenses - Using direct endpoint data */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(totalCollaboratorExpense)}
        icon={Users}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-50"
        tooltip="Colaboradores que llegan del endpoint de Zoho con categoría 'Pagos a colaboradores'"
      />

      {/* Other Expenses - All non-collaborator expenses */}
      <SummaryCard
        title="Otros Gastos"
        value={formatCurrency(otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Todos los gastos excepto colaboradores"
      />

      {/* Total Expenses - Sum of collaborators + others */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(calculatedTotalExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Suma de Gastos Colaboradores + Otros Gastos"
      />
    </div>
  );
};

export default React.memo(RefinedExpensesSection);
