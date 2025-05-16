
import React, { createContext, useContext, ReactNode } from 'react';
import { FinancialSummary, Transaction, CategorySummary } from '@/types/financial';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';

// Define the context value type
interface FinanceContextType {
  // Financial data
  summary: FinancialSummary;
  transactions: Transaction[];
  
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
  stripeIncome: 0,
  stripeFees: 0,
  stripeTransactionFees: 0,
  stripePayoutFees: 0,
  stripeAdditionalFees: 0,
  stripeNet: 0,
  stripeFeePercentage: 0,
  regularIncome: 0,
  collaboratorExpenses: [],
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
  stripeIncome: number;
  stripeFees: number;
  stripeTransactionFees: number;
  stripePayoutFees: number;
  stripeAdditionalFees: number;
  stripeNet: number;
  stripeFeePercentage: number;
  regularIncome: number;
  collaboratorExpenses: CategorySummary[];
}

// Provider component
export const FinanceProvider: React.FC<FinanceProviderProps> = ({
  children,
  summary,
  transactions,
  stripeIncome,
  stripeFees,
  stripeTransactionFees,
  stripePayoutFees,
  stripeAdditionalFees,
  stripeNet,
  stripeFeePercentage,
  regularIncome,
  collaboratorExpenses,
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
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    collaboratorExpenses,
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
