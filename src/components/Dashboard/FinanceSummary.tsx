
import React, { useEffect } from 'react';
import { FinancialSummary, CategorySummary, Transaction } from '@/types/financial';
import InitialBalanceSection from './FinancialCards/InitialBalanceSection';
import IncomeTabs from './FinancialCards/IncomeTabs';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { useFinancialSummaryProcessor } from '@/hooks/useFinancialSummaryProcessor';
import RefinedFinancialSummary from './FinancialCards/RefinedFinancialSummary';
import { isCollaboratorExpense } from '@/utils/financialUtils';

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
  dateRange?: { startDate: Date | null; endDate: Date | null };
  transactions?: Transaction[];
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
  regularIncome = 0,
  dateRange = { startDate: null, endDate: null },
  transactions = []
}) => {
  // Filter collaborator expenses using our utility function
  const collaboratorExpenses = expenseCategories.filter(
    category => isCollaboratorExpense(category.category)
  );
  
  // Use the processor hook to get a more accurate financial summary
  const processedData = useFinancialSummaryProcessor(transactions, summary.startingBalance || 0, collaboratorExpenses);
  
  // Create an improved summary that includes both original and processed data
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
    console.log("FinanceSummary - Date range:", dateRange);
    console.log("FinanceSummary - Transactions count:", transactions.length);
    console.log("FinanceSummary - Zoho income transactions:", 
      transactions.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length
    );
  }, [expenseCategories, collaboratorExpenses, summary, refinedSummary, processedData, dateRange, transactions]);

  return (
    <FinanceProvider
      summary={refinedSummary}
      transactions={transactions}
      dateRange={dateRange}
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

        {/* Removed duplicate IncomeTabs as it's now part of RefinedFinancialSummary */}

        {/* Financial Summary Section - Using our refined component */}
        <RefinedFinancialSummary />
      </div>
    </FinanceProvider>
  );
};

export default React.memo(FinanceSummary);
