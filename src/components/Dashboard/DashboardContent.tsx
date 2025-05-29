import React from 'react';
import { FinancialSummary } from './FinancialSummary';
import { MonthlyBalanceEditor } from './MonthlyBalanceEditor';
import { FinancialAssistantPromo } from './FinancialAssistant/FinancialAssistantPromo';
import { RefinedFinancialSummary } from './RefinedFinancialSummary';
import { UnpaidInvoicesList } from './UnpaidInvoicesList';
import { CollaboratorExpensesChart } from './Charts/CollaboratorExpensesChart';
import { RegularIncomeList } from './RegularIncomeList';
import { TransactionsTable } from './TransactionsTable';
import { EmbeddingManager } from './EmbeddingManager';

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
  dateRange,
  financialData,
  currentMonthDate,
  startingBalance,
  refreshData,
  handleBalanceChange,
  handleRefresh,
  loading,
  stripeIncome,
  stripeFees,
  stripeTransactionFees,
  stripePayoutFees,
  stripeAdditionalFees,
  stripeNet,
  stripeFeePercentage,
  regularIncome,
  monthlyBalance,
  totalZohoExpenses,
  unpaidInvoices
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

      {/* Financial Summary Section */}
      <RefinedFinancialSummary
        startingBalance={startingBalance}
        totalIncome={financialData.summary.totalIncome}
        totalExpense={financialData.summary.totalExpense}
        profit={financialData.summary.profit}
        profitMargin={financialData.summary.profitMargin}
        stripeIncome={stripeIncome}
        stripeFees={stripeFees}
        stripeTransactionFees={stripeTransactionFees}
        stripePayoutFees={stripePayoutFees}
        stripeAdditionalFees={stripeAdditionalFees}
        stripeNet={stripeNet}
        stripeFeePercentage={stripeFeePercentage}
        regularIncome={regularIncome}
        monthlyBalance={monthlyBalance}
        totalZohoExpenses={totalZohoExpenses}
      />

      {/* Unpaid Invoices List */}
      <UnpaidInvoicesList unpaidInvoices={unpaidInvoices} />

      {/* Collaborator Expenses Chart */}
      <CollaboratorExpensesChart expenses={financialData.collaboratorExpenses} />

      {/* Regular Income List */}
      <RegularIncomeList regularIncome={regularIncome} />

      {/* Transactions Table */}
      <TransactionsTable 
        transactions={financialData.transactions} 
        loading={loading} 
        refreshData={refreshData}
      />
    </div>
  );
};

export default DashboardContent;
