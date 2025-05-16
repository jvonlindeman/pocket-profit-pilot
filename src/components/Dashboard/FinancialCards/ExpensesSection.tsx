
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
  const { calculateCollaboratorExpense } = useFinanceMetrics();

  // Calculate total collaborator expense using the metrics hook
  const totalCollaboratorExpense = calculateCollaboratorExpense(collaboratorExpenses);
  
  // Add logging to debug the values
  useEffect(() => {
    console.log("ExpensesSection - Collaborator expenses:", collaboratorExpenses);
    console.log("ExpensesSection - Total collaborator expense:", totalCollaboratorExpense);
    console.log("ExpensesSection - Summary other expense:", summary.otherExpense);
    console.log("ExpensesSection - Summary total expense:", summary.totalExpense);
  }, [collaboratorExpenses, totalCollaboratorExpense, summary]);

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

      {/* Total Expenses */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(summary.totalExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
      />
    </div>
  );
};

export default React.memo(ExpensesSection);
