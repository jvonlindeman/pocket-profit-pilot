import React, { useEffect } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary,
    collaboratorExpenses
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  
  // Debug the values being used for display
  useEffect(() => {
    console.log("RefinedExpensesSection - Summary:", summary);
    console.log("RefinedExpensesSection - Collaborator expenses:", collaboratorExpenses);
    console.log("RefinedExpensesSection - Collaborator expense from summary:", summary.collaboratorExpense);
    console.log("RefinedExpensesSection - Other expense from summary:", summary.otherExpense);
    console.log("RefinedExpensesSection - Total expense from summary:", summary.totalExpense);
  }, [summary, collaboratorExpenses]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Collaborator Expenses - Using the value directly from summary */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(summary.collaboratorExpense)}
        icon={Users}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-50"
      />

      {/* Other Expenses - Using the value directly from summary */}
      <SummaryCard
        title="Otros Gastos"
        value={formatCurrency(summary.otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
      />

      {/* Total Expenses - Using the value directly from summary */}
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

export default React.memo(RefinedExpensesSection);
