
import React, { createContext, useContext, ReactNode } from 'react';
import { FinancialSummary, Transaction, CategorySummary, UnpaidInvoice } from '@/types/financial';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';

// Define the context value type
interface FinanceContextType {
  // Financial data
  summary: FinancialSummary;
  transactions: Transaction[];
  
  // Date range for the current financial data
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  
  // Stripe-specific data
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  
  // Regular income
  regularIncome: number;
  
  // Collaborator expenses
  collaboratorExpenses: CategorySummary[];
  
  // Unpaid invoices
  unpaidInvoices: UnpaidInvoice[];
  
  // Formatting functions from useFinanceFormatter
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
  formatChange: (value: number) => string;
  formatCompactNumber: (num: number) => string;
  getValueColorClass: (value: number) => string;
}

// Create the context with default values
export const FinanceContext = createContext<FinanceContextType>({
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    collaboratorExpense: 0,
    otherExpense: 0,
    profit: 0,
    profitMargin: 0,
    grossProfit: 0,
    grossProfitMargin: 0,
  },
  transactions: [],
  dateRange: {
    startDate: null,
    endDate: null,
  },
  stripeIncome: 0,
  stripeFees: 0,
  stripeTransactionFees: 0,
  stripePayoutFees: 0,
  stripeAdditionalFees: 0,
  stripeNet: 0,
  stripeFeePercentage: 0,
  regularIncome: 0,
  collaboratorExpenses: [],
  unpaidInvoices: [],
  formatCurrency: () => '',
  formatPercentage: () => '',
  formatChange: () => '',
  formatCompactNumber: () => '',
  getValueColorClass: () => '',
});

// Props for the FinanceProvider component
interface FinanceProviderProps {
  children: ReactNode;
  summary: FinancialSummary;
  transactions: Transaction[];
  dateRange?: { startDate: Date | null; endDate: Date | null };
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  regularIncome: number;
  collaboratorExpenses: CategorySummary[];
  unpaidInvoices?: UnpaidInvoice[];
}

// Provider component
export const FinanceProvider: React.FC<FinanceProviderProps> = ({
  children,
  summary,
  transactions,
  dateRange = { startDate: null, endDate: null },
  stripeIncome,
  stripeFees,
  stripeTransactionFees,
  stripePayoutFees,
  stripeAdditionalFees,
  stripeNet,
  stripeFeePercentage,
  regularIncome,
  collaboratorExpenses,
  unpaidInvoices = [],
}) => {
  // Use our formatter hook
  const {
    formatCurrency,
    formatPercentage,
    formatChange,
    formatCompactNumber,
    getValueColorClass
  } = useFinanceFormatter();

  const contextValue: FinanceContextType = {
    summary,
    transactions,
    dateRange,
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    collaboratorExpenses,
    unpaidInvoices,
    formatCurrency,
    formatPercentage,
    formatChange,
    formatCompactNumber,
    getValueColorClass,
  };

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook for using the finance context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  
  return context;
};
