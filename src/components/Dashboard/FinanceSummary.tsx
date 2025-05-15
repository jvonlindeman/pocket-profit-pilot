
import React from 'react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import InitialBalanceSection from './FinancialCards/InitialBalanceSection';
import IncomeTabs from './FinancialCards/IncomeTabs';
import FinancialSummarySection from './FinancialCards/FinancialSummarySection';

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  };

  // Calculate non-collaborator expenses
  const otherExpenses = summary.totalExpense - (summary.collaboratorExpense || 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Initial Balance Section */}
      <InitialBalanceSection 
        startingBalance={summary.startingBalance} 
        formatCurrency={formatCurrency} 
      />

      {/* Income Sources Section with Tabs */}
      <IncomeTabs
        summary={summary}
        stripeIncome={stripeIncome}
        stripeFees={stripeFees}
        stripeTransactionFees={stripeTransactionFees}
        stripePayoutFees={stripePayoutFees}
        stripeAdditionalFees={stripeAdditionalFees}
        stripeNet={stripeNet}
        stripeFeePercentage={stripeFeePercentage}
        regularIncome={regularIncome}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />

      {/* Financial Summary Section */}
      <FinancialSummarySection
        summary={summary}
        otherExpenses={otherExpenses}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />
    </div>
  );
};

export default FinanceSummary;
