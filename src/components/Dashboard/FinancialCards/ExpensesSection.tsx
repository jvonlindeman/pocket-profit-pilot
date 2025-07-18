
import React, { useEffect } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useFinanceMetrics } from '@/hooks/useFinanceMetrics';

const ExpensesSection: React.FC = () => {
  const { 
    summary, 
    collaboratorExpenses
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  const { calculateCollaboratorExpense, calculateExpenseBreakdown } = useFinanceMetrics();

  // Calculate total collaborator expense using the metrics hook
  const totalCollaboratorExpense = calculateCollaboratorExpense(collaboratorExpenses);
  
  // FIXED: Use summary.totalExpense as the source of truth for total expenses
  // Calculate "Otros Gastos" as the difference, but ensure it's not negative
  const otherExpense = Math.max(0, summary.totalExpense - totalCollaboratorExpense);
  
  // Total expenses should always be the summary total expense
  const totalExpense = summary.totalExpense;
  
  // Get expense breakdown for validation
  const expenseBreakdown = calculateExpenseBreakdown(totalCollaboratorExpense, otherExpense);
  
  // Add logging to debug the values and validate the calculation
  useEffect(() => {
    console.log("💰 ExpensesSection - EXPENSE BREAKDOWN VALIDATION:", {
      collaboratorExpense: totalCollaboratorExpense,
      calculatedOtherExpense: otherExpense,
      summaryOtherExpense: summary.otherExpense,
      totalExpense: totalExpense,
      summaryTotalExpense: summary.totalExpense,
      expenseBreakdown,
      calculation: `${totalCollaboratorExpense} + ${otherExpense} = ${totalCollaboratorExpense + otherExpense}`,
      isConsistent: Math.abs((totalCollaboratorExpense + otherExpense) - summary.totalExpense) < 0.01,
      possibleIssue: totalCollaboratorExpense > summary.totalExpense ? "Collaborator expense exceeds total expense!" : "Normal"
    });
  }, [totalCollaboratorExpense, otherExpense, summary, totalExpense, expenseBreakdown]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Collaborator Expenses */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(totalCollaboratorExpense)}
        icon={Users}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-50"
      />

      {/* Other Expenses */}
      <SummaryCard
        title="Otros Gastos"
        value={formatCurrency(otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
      />

      {/* Total Expenses - FIXED: Always shows the summary total expense */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(totalExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
      />
    </div>
  );
};

export default React.memo(ExpensesSection);
