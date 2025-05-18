
import React, { useEffect } from 'react';
import { ArrowDownIcon, Users } from 'lucide-react';
import SummaryCard from './SummaryCard';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { validateFinancialValue } from '@/utils/financialUtils';
import { registerVisibleSection } from '@/utils/uiDataCapture';

const RefinedExpensesSection: React.FC = () => {
  const { 
    summary,
    collaboratorExpenses
  } = useFinance();
  
  const { formatCurrency } = useFinanceFormatter();
  
  // Ensure all values are valid numbers
  const collaboratorExpense = validateFinancialValue(summary.collaboratorExpense);
  const otherExpense = validateFinancialValue(summary.otherExpense);
  const totalExpense = validateFinancialValue(summary.totalExpense);
  
  // Register this component as visible
  useEffect(() => {
    registerVisibleSection('expenses-section');
    return () => {};
  }, []);
  
  // Debug the values being used for display
  useEffect(() => {
    console.log("RefinedExpensesSection - Summary:", summary);
    console.log("RefinedExpensesSection - Collaborator expenses:", collaboratorExpenses);
    console.log("RefinedExpensesSection - Validated values:", {
      collaboratorExpense,
      otherExpense,
      totalExpense
    });
    // Verify that the calculated values add up correctly
    console.log("RefinedExpensesSection - Sum check:", 
      collaboratorExpense + otherExpense, "should equal", totalExpense);
  }, [summary, collaboratorExpenses, collaboratorExpense, otherExpense, totalExpense]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-component="expenses">
      {/* Collaborator Expenses */}
      <SummaryCard
        title="Gastos Colaboradores"
        value={formatCurrency(collaboratorExpense)}
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

      {/* Total Expenses */}
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

export default React.memo(RefinedExpensesSection);
