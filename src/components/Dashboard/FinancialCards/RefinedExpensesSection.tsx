
import React, { useEffect } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useFinanceMetrics } from '@/hooks/useFinanceMetrics';
import { useIsMobile } from '@/hooks/use-mobile';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary, 
    collaboratorExpenses,
    transactions
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  const { calculateCollaboratorExpense } = useFinanceMetrics();
  const isMobile = useIsMobile();

  // Calculate total collaborator expense using the metrics hook
  const totalCollaboratorExpense = calculateCollaboratorExpense(collaboratorExpenses);

  // FIXED: Calculate "Otros Gastos" as the difference to ensure mathematical consistency
  // This ensures: Gastos Colaboradores + Otros Gastos = Gastos Totales
  const otherExpense = Math.max(0, summary.totalExpense - totalCollaboratorExpense);
  
  // Total expenses should always be the summary total expense (source of truth)
  const totalExpense = summary.totalExpense;

  // Add detailed debugging for expense calculation consistency
  useEffect(() => {
    const zohoTransactions = transactions?.filter(tx => tx.source === 'Zoho') || [];
    const zohoExpenses = zohoTransactions.filter(tx => tx.type === 'expense');
    const totalZohoExpenses = zohoExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log("🔍 RefinedExpensesSection - EXPENSE CALCULATION VALIDATION:", {
      // Raw data
      totalTransactions: transactions?.length || 0,
      zohoTransactions: zohoTransactions.length,
      zohoExpenses: zohoExpenses.length,
      totalZohoExpenseAmount: totalZohoExpenses,
      
      // Collaborator data
      collaboratorExpensesFromHook: collaboratorExpenses,
      totalCollaboratorExpense,
      
      // Calculated values
      calculatedOtherExpense: otherExpense,
      summaryOtherExpense: summary.otherExpense,
      totalExpense: totalExpense,
      summaryTotalExpense: summary.totalExpense,
      
      // Mathematical validation
      calculation: `${totalCollaboratorExpense} + ${otherExpense} = ${totalCollaboratorExpense + otherExpense}`,
      calculatedSum: totalCollaboratorExpense + otherExpense,
      isConsistent: Math.abs((totalCollaboratorExpense + otherExpense) - summary.totalExpense) < 0.01,
      difference: (totalCollaboratorExpense + otherExpense) - summary.totalExpense,
      
      // Potential issues
      possibleIssues: {
        collaboratorExceedsTotal: totalCollaboratorExpense > summary.totalExpense,
        negativeOtherExpense: otherExpense < 0,
        summaryMismatch: Math.abs(summary.otherExpense - otherExpense) > 0.01
      }
    });

    // Log individual Zoho expense transactions for debugging
    if (zohoExpenses.length > 0) {
      console.log("💰 ZOHO EXPENSE TRANSACTIONS BREAKDOWN:");
      zohoExpenses.forEach(tx => {
        console.log(`  - ${tx.description}: $${tx.amount} (${tx.category})`);
      });
    }

  }, [transactions, collaboratorExpenses, totalCollaboratorExpense, otherExpense, summary]);

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
      {/* Collaborator Expenses */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(totalCollaboratorExpense)}
        icon={Users}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-50"
        tooltip="Fórmula: Suma de todos los gastos categorizados como colaboradores"
      />

      {/* Other Expenses */}
      <SummaryCard
        title="Otros Gastos"
        value={formatCurrency(otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Fórmula: Gastos Totales - Gastos Colaboradores"
      />

      {/* Total Expenses - FIXED: Always shows summary.totalExpense */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(totalExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Fórmula: Gastos Colaboradores + Otros Gastos"
      />
    </div>
  );
};

export default React.memo(RefinedExpensesSection);
