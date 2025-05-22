
import React, { createContext, useContext } from 'react';
import { FinancialSummary, Transaction } from '@/types/financial';
import { FinanceProvider } from '@/contexts/FinanceContext';
import InitialSetup from '@/components/Dashboard/InitialSetup';
import DashboardHeader from '@/components/Dashboard/Header/DashboardHeader';
import LoadingErrorState from '@/components/Dashboard/LoadingErrorState';

interface DashboardContextProps {
  dateRange: { startDate: Date | null; endDate: Date | null };
  onDateRangeChange: (range: { startDate: Date; endDate: Date }) => void;
  getCurrentMonthRange: () => { startDate: Date; endDate: Date };
  dataInitialized: boolean;
  onLoadData: () => void;
  showBalanceDialog: boolean;
  setShowBalanceDialog: (show: boolean) => void;
  currentMonthDate: Date;
  onBalanceSaved: () => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  rawResponse: any;
  refreshData: (force: boolean) => void;
  financialData: {
    summary: FinancialSummary;
    transactions: Transaction[];
    expenseByCategory: any[];
  };
  startingBalance: number;
  handleBalanceChange: (balance: number, opexAmount?: number, itbmAmount?: number, profitPercentage?: number, notes?: string) => void;
  handleRefresh: () => void;
  periodTitle: string;
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
  collaboratorExpenses: any[];
}

const DashboardContext = createContext<DashboardContextProps | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps extends DashboardContextProps {
  children: React.ReactNode;
}

const DashboardProvider: React.FC<DashboardProviderProps> = ({ children, ...contextValues }) => {
  const {
    dateRange,
    onDateRangeChange,
    getCurrentMonthRange,
    dataInitialized,
    onLoadData,
    showBalanceDialog,
    setShowBalanceDialog,
    currentMonthDate,
    onBalanceSaved,
    loading,
    error,
    onRetry,
    financialData,
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    collaboratorExpenses,
  } = contextValues;

  return (
    <DashboardContext.Provider value={contextValues}>
      {/* Initial setup components */}
      <InitialSetup 
        dataInitialized={dataInitialized}
        onLoadData={onLoadData}
        showBalanceDialog={showBalanceDialog}
        setShowBalanceDialog={setShowBalanceDialog}
        currentMonthDate={currentMonthDate}
        onBalanceSaved={onBalanceSaved}
      />
      
      {/* Header section */}
      <DashboardHeader 
        dateRange={dateRange} 
        onDateRangeChange={onDateRangeChange}
        getCurrentMonthRange={getCurrentMonthRange}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading and error state handling */}
        <LoadingErrorState 
          loading={loading} 
          error={error}
          onRetry={onRetry}
        />
        
        {/* Dashboard content with Finance context provider */}
        {dataInitialized && !loading && !error && (
          <FinanceProvider
            summary={financialData.summary}
            transactions={financialData.transactions}
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
            {children}
          </FinanceProvider>
        )}
      </main>
    </DashboardContext.Provider>
  );
};

export default DashboardProvider;
