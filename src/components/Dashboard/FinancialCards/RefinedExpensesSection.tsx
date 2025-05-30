import React from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useFinanceMetrics } from '@/hooks/useFinanceMetrics';
import { useIsMobile } from '@/hooks/use-mobile';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary, 
    collaboratorExpenses
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  const { calculateCollaboratorExpense } = useFinanceMetrics();
  const isMobile = useIsMobile();

  // Calculate total collaborator expense using the metrics hook
  const totalCollaboratorExpense = calculateCollaboratorExpense(collaboratorExpenses);

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
        value={formatCurrency(summary.otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Fórmula: Gastos Totales - Gastos Colaboradores"
      />

      {/* Total Expenses */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(summary.totalExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        tooltip="Fórmula: Gastos Colaboradores + Otros Gastos"
      />
    </div>
  );
};

export default React.memo(RefinedExpensesSection);
