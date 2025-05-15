
import React from 'react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import InitialBalanceSection from './FinancialCards/InitialBalanceSection';
import IncomeTabs from './FinancialCards/IncomeTabs';
import FinancialSummarySection from './FinancialCards/FinancialSummarySection';
import { FinanceProvider } from '@/contexts/FinanceContext';

interface FinanceSummaryProps {
  summary: FinancialSummary;
  expenseCategories?: CategorySummary[];
  stripeIncome?: number;
  stripeFees?: number; 
  stripeTransactionFees?: number;
  stripePayoutFees?: number;
  stripeAdditionalFees?: number;
  stripeNet?: number;
  stripeFeePercentage?: number;
  regularIncome?: number;
}

const FinanceSummary: React.FC<FinanceSummaryProps> = ({ 
  summary, 
  expenseCategories = [],
  stripeIncome = 0,
  stripeFees = 0,
  stripeTransactionFees = 0,
  stripePayoutFees = 0,
  stripeAdditionalFees = 0,
  stripeNet = 0,
  stripeFeePercentage = 0,
  regularIncome = 0
}) => {
  // Get collaborator expenses from expense categories
  const collaboratorExpenses = expenseCategories.filter(
    category => category.category.toLowerCase().includes('colaborador')
  );

  return (
    <FinanceProvider
      summary={summary}
      transactions={[]} // We don't need transactions in this component tree
      stripeIncome={stripeIncome}
      stripeFees={stripeFees}
      stripeTransactionFees={stripeTransactionFees}
      stripePayoutFees={stripePayoutFees}
      stripeAdditionalFees={stripeAdditionalFees}
      stripeNet={stripeNet}
      stripeFeePercentage={stripeFeePercentage}
      regularIncome={regularIncome}
      collaboratorExpenses={collaboratorExpenses}
    >
      <div className="space-y-8 animate-fade-in">
        {/* Initial Balance Section */}
        <InitialBalanceSection startingBalance={summary.startingBalance} />

        {/* Income Sources Section with Tabs */}
        <IncomeTabs />

        {/* Financial Summary Section */}
        <FinancialSummarySection />
      </div>
    </FinanceProvider>
  );
};

export default React.memo(FinanceSummary);
