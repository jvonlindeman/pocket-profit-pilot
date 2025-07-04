import React from 'react';
import PeriodHeader from './PeriodHeader';
import CacheMonitor from './CacheMonitor';
import NoTransactionsWarning from './NoTransactionsWarning';
import MonthlyBalanceEditor from './MonthlyBalanceEditor';
import SalaryCalculator from './SalaryCalculator';
import FinanceSummary from './FinanceSummary';
import TransactionList from './TransactionList';
import { FinancialSummary, Transaction, UnpaidInvoice } from '@/types/financial';

// --- NEW TYPE DEFINITIONS ---
interface CoreData {
  periodTitle: string;
  dateRange: { startDate: Date; endDate: Date };
  financialData: {
    summary: FinancialSummary;
    transactions: Transaction[];
    expenseByCategory: any[];
  };
  currentMonthDate: Date;
  monthlyBalance: any;
  totalZohoExpenses: number;
  unpaidInvoices?: UnpaidInvoice[];
  startingBalance: number;
  regularIncome: number;
}

interface StripeData {
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
}

interface ActionHandlers {
  refreshData: (force: boolean) => void;
  handleBalanceChange: (
    balance: number,
    opexAmount?: number,
    itbmAmount?: number,
    profitPercentage?: number,
    taxReservePercentage?: number,
    includeZohoFiftyPercent?: boolean
  ) => void;
  handleRefresh: () => void;
}

interface DashboardContentProps {
  coreData: CoreData;
  stripeData: StripeData;
  actions: ActionHandlers;
  loading: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  coreData,
  stripeData,
  actions,
  loading,
}) => {
  const {
    periodTitle,
    dateRange,
    financialData,
    currentMonthDate,
    monthlyBalance,
    totalZohoExpenses,
    unpaidInvoices = [],
    startingBalance,
    regularIncome,
  } = coreData;

  const {
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
  } = stripeData;
  
  const { refreshData, handleBalanceChange, handleRefresh } = actions;

  // Enhanced debugging and improved value extraction logic
  console.log("💼 DashboardContent: Monthly balance data received:", monthlyBalance);
  
  // IMMEDIATE VALUES: Use the most current values with better defaults - FIXED: Added include_zoho_fifty_percent tracking
  const opexAmount = monthlyBalance?.opex_amount ?? 35;
  const itbmAmount = monthlyBalance?.itbm_amount ?? 0;
  const profitPercentage = monthlyBalance?.profit_percentage ?? 1;
  const taxReservePercentage = monthlyBalance?.tax_reserve_percentage ?? 5;
  const includeZohoFiftyPercent = monthlyBalance?.include_zoho_fifty_percent ?? true;
  
  console.log("💼 DashboardContent: IMMEDIATE VALUES for calculator (FIXED WITH TRACKING):", { 
    opexAmount, 
    itbmAmount, 
    profitPercentage, 
    taxReservePercentage,
    includeZohoFiftyPercent, // NOW PROPERLY TRACKED
    startingBalance,
    monthlyBalanceId: monthlyBalance?.id,
    monthlyBalanceTimestamp: monthlyBalance?.updated_at,
    timestamp: new Date().toISOString()
  });
  
  // REACTIVE KEY: Forces complete re-render when ANY value changes - FIXED: Added includeZohoFiftyPercent
  const calculatorKey = `calculator-${monthlyBalance?.id || 'default'}-${monthlyBalance?.updated_at || Date.now()}-${startingBalance}-${opexAmount}-${itbmAmount}-${profitPercentage}-${taxReservePercentage}-${includeZohoFiftyPercent}`;
  
  console.log("💼 DashboardContent: Calculator key (forces re-render - FIXED):", calculatorKey);
  console.log("💼 DashboardContent: Transaction count:", financialData.transactions.length);
  console.log("💼 DashboardContent: Zoho income transactions:", 
    financialData.transactions.filter(tx => tx.type === 'income' && tx.source === 'Zoho').length
  );
  console.log("💼 DashboardContent: Unpaid invoices:", unpaidInvoices?.length || 0);
  console.log("💼 DashboardContent: PASSING includeZohoFiftyPercent to SalaryCalculator:", includeZohoFiftyPercent);

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

      {/* Salary Calculator with IMMEDIATE REACTIVE UPDATES - FIXED: Now properly passing includeZohoFiftyPercent */}
      <div className="mb-6">
        <SalaryCalculator 
          key={calculatorKey}
          zohoIncome={regularIncome}
          stripeIncome={stripeNet}
          opexAmount={opexAmount}
          itbmAmount={itbmAmount}
          profitPercentage={profitPercentage}
          taxReservePercentage={taxReservePercentage}
          includeZohoFiftyPercent={includeZohoFiftyPercent}
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
