
import React, { useEffect } from 'react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import { safeParseNumber } from '@/utils/financialUtils';

// Import individual card components
import BalanceCard from './BalanceCard';
import StripeIncomeCard from './StripeIncomeCard';
import ZohoIncomeCard from './ZohoIncomeCard';
import TotalIncomeCard from './TotalIncomeCard';
import CollaboratorExpenseCard from './CollaboratorExpenseCard';
import OtherExpensesCard from './OtherExpensesCard';
import TotalExpensesCard from './TotalExpensesCard';
import ProfitCard from './ProfitCard';

interface FinanceSummaryProps {
  summary: FinancialSummary;
  expenseCategories?: CategorySummary[];
  stripeIncome?: number;
  regularIncome?: number;
  stripeOverride?: number | null;
}

const FinanceSummary: React.FC<FinanceSummaryProps> = ({ 
  summary, 
  expenseCategories = [],
  stripeIncome = 0,
  regularIncome = 0,
  stripeOverride = null
}) => {
  // Debug logging for component render
  useEffect(() => {
    console.log('🧩 FinanceSummary rendered with props:', { 
      summary, 
      stripeIncome, 
      regularIncome, 
      stripeOverride,
      startingBalance: summary.startingBalance
    });
  }, [summary, stripeIncome, regularIncome, stripeOverride]);

  // Ensure all values are numbers
  const totalIncome = safeParseNumber(summary.totalIncome);
  const totalExpense = safeParseNumber(summary.totalExpense);
  const collaboratorExpense = safeParseNumber(summary.collaboratorExpense || 0);
  const otherExpense = safeParseNumber(summary.otherExpense || 0);
  const profit = safeParseNumber(summary.profit);
  const profitMargin = safeParseNumber(summary.profitMargin);
  // Handle potentially undefined or null starting balance
  const startingBalance = summary.startingBalance !== undefined ? safeParseNumber(summary.startingBalance) : null;

  // Check if stripe income is using an override
  const isStripeOverridden = stripeOverride !== null;
  
  // Ensure all displayed values are numbers
  const safeStripeIncome = safeParseNumber(stripeIncome);
  const safeRegularIncome = safeParseNumber(regularIncome);

  console.log('FinanceSummary calculated values:', {
    totalIncome, 
    totalExpense,
    collaboratorExpense,
    otherExpense,
    profit,
    profitMargin,
    startingBalance,
    safeStripeIncome,
    safeRegularIncome,
    stripeOverride
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      <BalanceCard startingBalance={startingBalance} />
      <StripeIncomeCard stripeIncome={safeStripeIncome} stripeOverride={stripeOverride} />
      <ZohoIncomeCard regularIncome={safeRegularIncome} />
      <TotalIncomeCard totalIncome={totalIncome} />
      <CollaboratorExpenseCard collaboratorExpense={collaboratorExpense} />
      <OtherExpensesCard otherExpense={otherExpense} />
      <TotalExpensesCard totalExpense={totalExpense} />
      <ProfitCard profit={profit} profitMargin={profitMargin} />
    </div>
  );
};

export default FinanceSummary;
