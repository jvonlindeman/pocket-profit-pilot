
import React, { useEffect } from 'react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import InitialBalanceSection from './FinancialCards/InitialBalanceSection';
import IncomeTabs from './FinancialCards/IncomeTabs';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { useFinancialSummaryProcessor } from '@/hooks/useFinancialSummaryProcessor';
import RefinedFinancialSummary from './FinancialCards/RefinedFinancialSummary';

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
  // Filter collaborator expenses - using case-insensitive matching
  const collaboratorExpenses = expenseCategories.filter(
    category => category.category.toLowerCase().includes('colaborador') ||
                category.category.toLowerCase().includes('pagos a colaboradores')
  );
  
  // Use the new hook to get processed data
  const processedData = useFinancialSummaryProcessor([], summary.startingBalance || 0, collaboratorExpenses);
  
  // Calculate a more accurate summary that considers both the original summary and collaborator expenses
  const refinedSummary = {
    ...summary,
    collaboratorExpense: processedData.summary.collaboratorExpense,
    otherExpense: summary.totalExpense - processedData.summary.collaboratorExpense
  };
  
  // Add debugging to check what's being found
  useEffect(() => {
    console.log("FinanceSummary - All expense categories:", expenseCategories);
    console.log("FinanceSummary - Filtered collaborator expenses:", collaboratorExpenses);
    console.log("FinanceSummary - Original summary:", summary);
    console.log("FinanceSummary - Refined summary:", refinedSummary);
    console.log("FinanceSummary - Processed data:", processedData);
  }, [expenseCategories, collaboratorExpenses, summary, refinedSummary, processedData]);

  return (
    <FinanceProvider
      summary={refinedSummary}
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
        <InitialBalanceSection startingBalance={refinedSummary.startingBalance || 0} />

        {/* Income Sources Section with Tabs */}
        <IncomeTabs />

        {/* Financial Summary Section - Using our new component */}
        <RefinedFinancialSummary />
      </div>
    </FinanceProvider>
  );
};

export default React.memo(FinanceSummary);
