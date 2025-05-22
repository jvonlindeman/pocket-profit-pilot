
import React from 'react';
import PeriodHeader from './PeriodHeader';
import CacheMonitor from './CacheMonitor';
import NoTransactionsWarning from './NoTransactionsWarning';
import MonthlyBalanceEditor from './MonthlyBalanceEditor';
import SalaryCalculator from './SalaryCalculator';
import RefinedFinancialSummary from './FinancialCards/RefinedFinancialSummary';
import TransactionList from './TransactionList';
import { FinancialSummary, Transaction } from '@/types/financial';

interface DashboardContentProps {
  periodTitle: string;
  dateRange: { startDate: Date; endDate: Date };
  financialData: {
    summary: FinancialSummary;
    transactions: Transaction[];
    expenseByCategory: any[];
  };
  currentMonthDate: Date;
  startingBalance: number;
  refreshData: (force: boolean) => void;
  handleBalanceChange: (balance: number, opexAmount?: number, itbmAmount?: number, profitPercentage?: number, notes?: string) => void;
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
  totalZohoExpenses
}) => {
  // Get calculator values from the monthly balance
  const opexAmount = monthlyBalance?.opex_amount !== null ? monthlyBalance?.opex_amount || 35 : 35;
  const itbmAmount = monthlyBalance?.itbm_amount !== null ? monthlyBalance?.itbm_amount || 0 : 0;
  const profitPercentage = monthlyBalance?.profit_percentage !== null ? monthlyBalance?.profit_percentage || 1 : 1;
  
  console.log("DashboardContent: Using values for calculator:", { opexAmount, itbmAmount, profitPercentage });
  console.log("DashboardContent: Transaction count:", financialData.transactions.length);
  console.log("DashboardContent: Zoho income transactions:", 
    financialData.transactions.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length
  );

  return (
    <>
      {/* Period and refresh button */}
      <PeriodHeader periodTitle={periodTitle} onRefresh={handleRefresh} />
      
      {/* Use our new CacheMonitor component */}
      <CacheMonitor 
        dateRange={dateRange}
        onRefresh={() => refreshData(true)}
      />

      {/* Warning message when no transactions exist */}
      {financialData.transactions.length === 0 && <NoTransactionsWarning />}

      {/* Monthly Balance Editor moved up to be above FinanceSummary */}
      <div className="mb-6">
        <MonthlyBalanceEditor 
          currentDate={currentMonthDate}
          onBalanceChange={handleBalanceChange}
        />
      </div>

      {/* New Salary Calculator - Updated with additional props */}
      <div className="mb-6">
        <SalaryCalculator 
          zohoIncome={regularIncome}
          stripeIncome={stripeNet}
          opexAmount={opexAmount}
          itbmAmount={itbmAmount}
          profitPercentage={profitPercentage}
          startingBalance={startingBalance}
          totalZohoExpenses={totalZohoExpenses}
        />
      </div>

      {/* Financial Summary with improved organization - Using RefinedFinancialSummary instead */}
      <RefinedFinancialSummary />

      {/* Listado de transacciones */}
      <div className="mt-6">
        <TransactionList 
          transactions={financialData.transactions} 
          onRefresh={handleRefresh}
          isLoading={loading}
        />
      </div>
    </>
  );
};

export default DashboardContent;
