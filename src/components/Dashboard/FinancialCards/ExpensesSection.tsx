import React from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';

const ExpensesSection: React.FC = () => {
  const { 
    summary, 
    formatCurrency
  } = useFinance();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Collaborator Expenses */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(summary.collaboratorExpense || 0)}
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
