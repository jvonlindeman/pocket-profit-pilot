
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
  
  // FIXED: Calculate total expenses as collaborator + other expenses for consistency
  const calculatedTotalExpense = totalCollaboratorExpense + summary.otherExpense;
  
  // Get expense breakdown for validation
  const expenseBreakdown = calculateExpenseBreakdown(totalCollaboratorExpense, summary.otherExpense);
  
  // Add logging to debug the values and validate the calculation
  useEffect(() => {
    console.log("💰 ExpensesSection - EXPENSE BREAKDOWN VALIDATION:", {
      collaboratorExpense: totalCollaboratorExpense,
      otherExpense: summary.otherExpense,
      calculatedTotal: calculatedTotalExpense,
      summaryTotal: summary.totalExpense,
      expenseBreakdown,
      calculation: `${totalCollaboratorExpense} + ${summary.otherExpense} = ${calculatedTotalExpense}`,
      isConsistent: Math.abs(calculatedTotalExpense - summary.totalExpense) < 0.01
    });
  }, [totalCollaboratorExpense, summary.otherExpense, calculatedTotalExpense, summary.totalExpense, expenseBreakdown]);

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
        value={formatCurrency(summary.otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
      />

      {/* Total Expenses - FIXED: Now shows the sum of the other two cards */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(calculatedTotalExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
      />
    </div>
  );
};

export default React.memo(ExpensesSection);
