import React, { useEffect } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useIsMobile } from '@/hooks/use-mobile';
import { isStripeFeeTransaction } from '@/services/financialService';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary, 
    transactions
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  const isMobile = useIsMobile();

  // FIXED: Calculate expenses excluding Stripe fees (consistent with processTransactionData)
  const operationalExpenseTransactions = transactions?.filter(tx => 
    tx.type === 'expense' && 
    !isStripeFeeTransaction(tx)
  ) || [];

  // Calculate collaborator expenses from operational expenses only
  const collaboratorTransactions = operationalExpenseTransactions.filter(tx => 
    tx.category === 'Pagos a colaboradores'
  );
  
  const totalCollaboratorExpense = collaboratorTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate "Otros Gastos" as operational expenses excluding collaborators
  const otherExpenseTransactions = operationalExpenseTransactions.filter(tx => 
    tx.category !== 'Pagos a colaboradores'
  );
  
  const otherExpense = otherExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Use summary.totalExpense (which already excludes Stripe fees from processTransactionData)
  const totalExpenseFromSummary = summary.totalExpense;

  // Add detailed debugging for the STRIPE FEE EXCLUSION calculation
  useEffect(() => {
    const allExpenseTransactions = transactions?.filter(tx => tx.type === 'expense') || [];
    const stripeFeesTransactions = allExpenseTransactions.filter(tx => isStripeFeeTransaction(tx));
    const totalFromAllExpenses = allExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalStripeFees = stripeFeesTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const calculatedTotalOperational = totalCollaboratorExpense + otherExpense;
    
    console.log("🔍 RefinedExpensesSection - STRIPE FEE EXCLUSION CALCULATION:", {
      // Raw transaction data
      totalTransactions: transactions?.length || 0,
      allExpenseTransactions: allExpenseTransactions.length,
      totalFromAllExpenses,
      
      // Stripe fees separation
      stripeFeesCount: stripeFeesTransactions.length,
      totalStripeFees,
      operationalExpenseCount: operationalExpenseTransactions.length,
      
      // Collaborator calculation (operational only)
      collaboratorTransactions: collaboratorTransactions.length,
      collaboratorTransactionDetails: collaboratorTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        category: tx.category,
        description: tx.description
      })),
      totalCollaboratorExpense,
      
      // Other expenses calculation (operational only)
      otherExpenseTransactions: otherExpenseTransactions.length,
      otherExpenseCategories: [...new Set(otherExpenseTransactions.map(tx => tx.category))],
      otherExpense,
      
      // Mathematical validation
      calculatedTotalOperational,
      summaryTotalExpense: summary.totalExpense,
      difference: calculatedTotalOperational - summary.totalExpense,
      isConsistent: Math.abs(calculatedTotalOperational - summary.totalExpense) < 0.01,
      
      // Verification against processTransactionData logic
      verification: {
        totalExpensesIncludingFees: totalFromAllExpenses,
        stripeFeesExcluded: totalStripeFees,
        operationalExpensesCalculated: calculatedTotalOperational,
        summaryTotalExpenseFromProcessor: summary.totalExpense,
        matchesSummary: Math.abs(calculatedTotalOperational - summary.totalExpense) < 0.01
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

  }, [transactions, operationalExpenseTransactions, collaboratorTransactions, otherExpenseTransactions, totalCollaboratorExpense, otherExpense, summary]);

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

      {/* Total Expenses - Using summary.totalExpense (excludes Stripe fees) */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(totalExpenseFromSummary)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Total de gastos operacionales (excluyendo comisiones de Stripe)"
      />
    </div>
  );
};

export default React.memo(RefinedExpensesSection);
