
import React from 'react';
import PeriodHeader from './PeriodHeader';
import CacheMonitor from './CacheMonitor';
import NoTransactionsWarning from './NoTransactionsWarning';
import MonthlyBalanceEditor from './MonthlyBalanceEditor';
import SalaryCalculator from './SalaryCalculator';
import FinanceSummary from './FinanceSummary';
import TransactionList from './TransactionList';
import { FinancialSummary, Transaction, UnpaidInvoice } from '@/types/financial';

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
  unpaidInvoices?: UnpaidInvoice[];
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
  unpaidInvoices = []
}) => {
  // Enhanced debugging and improved value extraction logic
  console.log("DashboardContent: Monthly balance data received:", monthlyBalance);
  
  // Improved value extraction with better null/undefined handling
  const opexAmount = monthlyBalance?.opex_amount ?? 35;
  const itbmAmount = monthlyBalance?.itbm_amount ?? 0;
  const profitPercentage = monthlyBalance?.profit_percentage ?? 1;
  const taxReservePercentage = monthlyBalance?.tax_reserve_percentage ?? 5;
  
  console.log("DashboardContent: Extracted values for calculator:", { 
    opexAmount, 
    itbmAmount, 
    profitPercentage, 
    taxReservePercentage,
    monthlyBalanceId: monthlyBalance?.id,
    monthlyBalanceTimestamp: monthlyBalance?.updated_at
  });
  
  // Create a unique key for forcing re-render when values change
  const calculatorKey = `calculator-${monthlyBalance?.id || 'default'}-${monthlyBalance?.updated_at || Date.now()}`;
  
  console.log("DashboardContent: Transaction count:", financialData.transactions.length);
  console.log("DashboardContent: Zoho income transactions:", 
    financialData.transactions.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length
  );
  console.log("DashboardContent: Unpaid invoices:", unpaidInvoices?.length || 0);

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

      {/* New Salary Calculator with enhanced debugging and forced re-render */}
      <div className="mb-6">
        <SalaryCalculator 
          key={calculatorKey}
          zohoIncome={regularIncome}
          stripeIncome={stripeNet}
          opexAmount={opexAmount}
          itbmAmount={itbmAmount}
          profitPercentage={profitPercentage}
          taxReservePercentage={taxReservePercentage}
          startingBalance={startingBalance}
          totalZohoExpenses={totalZohoExpenses}
        />
      </div>

      {/* Financial Summary with improved organization */}
      <FinanceSummary 
        summary={financialData.summary} 
        expenseCategories={financialData.expenseByCategory}
        stripeIncome={stripeIncome}
        stripeFees={stripeFees}
        stripeTransactionFees={stripeTransactionFees}
        stripePayoutFees={stripePayoutFees}
        stripeAdditionalFees={stripeAdditionalFees}
        stripeNet={stripeNet}
        stripeFeePercentage={stripeFeePercentage}
        regularIncome={regularIncome}
        dateRange={dateRange}
        transactions={financialData.transactions}
        unpaidInvoices={unpaidInvoices}
      />

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
