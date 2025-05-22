
import React, { useEffect } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { useFinanceMetrics } from '@/hooks/useFinanceMetrics';
import { validateFinancialValue } from '@/utils/financialUtils';
import { registerInteraction } from '@/utils/uiCapture';
import { useIsMobile } from '@/hooks/use-mobile';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary,
    collaboratorExpenses
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  const { calculateCollaboratorExpense } = useFinanceMetrics();
  const isMobile = useIsMobile();
  
  // Calculate collaborator expense using the finance metrics hook
  const collaboratorExpense = calculateCollaboratorExpense(collaboratorExpenses);
  
  // Ensure all values are valid numbers
  const validCollaboratorExpense = validateFinancialValue(collaboratorExpense);
  const totalExpense = validateFinancialValue(summary.totalExpense);
  const otherExpense = totalExpense - validCollaboratorExpense;
  
  // Register this component as visible
  useEffect(() => {
    registerInteraction('visible-section', 'view', { section: 'expenses-section' });
    return () => {};
  }, []);
  
  // Debug the values being used for display
  useEffect(() => {
    console.log("RefinedExpensesSection - Summary:", summary);
    console.log("RefinedExpensesSection - Collaborator expenses:", collaboratorExpenses);
    console.log("RefinedExpensesSection - Calculated collaborator expense:", validCollaboratorExpense);
    console.log("RefinedExpensesSection - Calculated other expense:", otherExpense);
    console.log("RefinedExpensesSection - Total expense:", totalExpense);
    // Verify that the calculated values add up correctly
    console.log("RefinedExpensesSection - Sum check:", 
      validCollaboratorExpense + otherExpense, "should equal", totalExpense);
  }, [summary, collaboratorExpenses, validCollaboratorExpense, otherExpense, totalExpense]);

  return (
    <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-6'}`} data-component="expenses">
      {/* Collaborator Expenses */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(validCollaboratorExpense)}
        icon={Users}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-50"
        valueSize={isMobile ? 'small' : 'medium'}
      />

      {/* Other Expenses */}
      <SummaryCard
        title="Otros Gastos"
        value={formatCurrency(otherExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        valueSize={isMobile ? 'small' : 'medium'}
      />

      {/* Total Expenses */}
      <SummaryCard
        title="Gastos Totales"
        value={formatCurrency(totalExpense)}
        icon={ArrowDownIcon}
        iconColor="text-red-500"
        iconBgColor="bg-red-50"
        valueSize={isMobile ? 'small' : 'medium'}
      />
    </div>
  );
};

export default React.memo(RefinedExpensesSection);
