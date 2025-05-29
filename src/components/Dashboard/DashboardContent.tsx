
import React from 'react';
import { FinancialAssistantPromo } from './FinancialAssistant/FinancialAssistantPromo';
import RefinedFinancialSummary from './FinancialCards/RefinedFinancialSummary';
import { EmbeddingManager } from './EmbeddingManager';
import MonthlyBalanceEditor from './MonthlyBalanceEditor';

interface DashboardContentProps {
  periodTitle: string;
  dateRange: { startDate: Date | null; endDate: Date | null };
  financialData: any;
  currentMonthDate: Date;
  startingBalance: number;
  refreshData: (forceRefresh: boolean) => Promise<boolean>;
  handleBalanceChange: (balance: number, opexAmount?: number, itbmAmount?: number, profitPercentage?: number, taxReservePercentage?: number) => void;
  handleRefresh: () => void;
  loading: boolean;
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  regularIncome: number;
  monthlyBalance: any;
  totalZohoExpenses: number;
  unpaidInvoices: any[];
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  periodTitle,
  currentMonthDate,
  handleBalanceChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Period Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">{periodTitle}</h1>
      </div>

      {/* Monthly Balance Editor */}
      <MonthlyBalanceEditor 
        currentDate={currentMonthDate}
        onBalanceChange={handleBalanceChange}
      />

      {/* AI Assistant Promo */}
      <FinancialAssistantPromo />

      {/* Embedding Manager - New Section */}
      <EmbeddingManager />

      {/* Financial Summary Section - Using existing component structure */}
      <RefinedFinancialSummary />
    </div>
  );
};

export default DashboardContent;
