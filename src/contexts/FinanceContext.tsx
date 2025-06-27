
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
  
  console.log("🔧 FinanceProvider: Initializing with data validation...");
  
  try {
    // SAFE DATA VALIDATION: Ensure all props are valid
    const safeSummary = summary || {
      totalIncome: 0,
      totalExpense: 0,
      collaboratorExpense: 0,
      otherExpense: 0,
      profit: 0,
      profitMargin: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
    };
    
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safeCollaboratorExpenses = Array.isArray(collaboratorExpenses) ? collaboratorExpenses : [];
    const safeUnpaidInvoices = Array.isArray(unpaidInvoices) ? unpaidInvoices : [];
    
    // Validate numbers and provide safe defaults
    const safeStripeIncome = typeof stripeIncome === 'number' && !isNaN(stripeIncome) ? stripeIncome : 0;
    const safeStripeFees = typeof stripeFees === 'number' && !isNaN(stripeFees) ? stripeFees : 0;
    const safeStripeTransactionFees = typeof stripeTransactionFees === 'number' && !isNaN(stripeTransactionFees) ? stripeTransactionFees : 0;
    const safeStripePayoutFees = typeof stripePayoutFees === 'number' && !isNaN(stripePayoutFees) ? stripePayoutFees : 0;
    const safeStripeAdditionalFees = typeof stripeAdditionalFees === 'number' && !isNaN(stripeAdditionalFees) ? stripeAdditionalFees : 0;
    const safeStripeNet = typeof stripeNet === 'number' && !isNaN(stripeNet) ? stripeNet : 0;
    const safeStripeFeePercentage = typeof stripeFeePercentage === 'number' && !isNaN(stripeFeePercentage) ? stripeFeePercentage : 0;
    const safeRegularIncome = typeof regularIncome === 'number' && !isNaN(regularIncome) ? regularIncome : 0;
    
    console.log("🔧 FinanceProvider: Data validated successfully", {
      summaryValid: !!safeSummary,
      transactionsCount: safeTransactions.length,
      collaboratorExpensesCount: safeCollaboratorExpenses.length,
      unpaidInvoicesCount: safeUnpaidInvoices.length,
      stripeIncomeValid: !isNaN(safeStripeIncome),
      regularIncomeValid: !isNaN(safeRegularIncome)
    });

    // Use our formatter hook with error handling
    const financeFormatter = useFinanceFormatter();
    const {
      formatCurrency,
      formatPercentage,
      formatChange,
      formatCompactNumber,
      getValueColorClass
    } = financeFormatter;

    const contextValue: FinanceContextType = {
      summary: safeSummary,
      transactions: safeTransactions,
      dateRange,
      stripeIncome: safeStripeIncome,
      stripeFees: safeStripeFees,
      stripeTransactionFees: safeStripeTransactionFees,
      stripePayoutFees: safeStripePayoutFees,
      stripeAdditionalFees: safeStripeAdditionalFees,
      stripeNet: safeStripeNet,
      stripeFeePercentage: safeStripeFeePercentage,
      regularIncome: safeRegularIncome,
      collaboratorExpenses: safeCollaboratorExpenses,
      unpaidInvoices: safeUnpaidInvoices,
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
    
  } catch (err) {
    console.error("🚨 FinanceProvider: Critical error during initialization:", err);
    
    // Return a safe fallback provider
    const fallbackContextValue: FinanceContextType = {
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
      dateRange: { startDate: null, endDate: null },
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
      formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
      formatPercentage: (percentage: number) => `${percentage.toFixed(2)}%`,
      formatChange: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`,
      formatCompactNumber: (num: number) => num.toString(),
      getValueColorClass: (value: number) => value >= 0 ? 'text-green-600' : 'text-red-600',
    };
    
    return (
      <FinanceContext.Provider value={fallbackContextValue}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <p className="text-yellow-800">
            ⚠️ Hubo un problema con los datos financieros. Se están usando valores predeterminados.
          </p>
        </div>
        {children}
      </FinanceContext.Provider>
    );
  }
};

// Custom hook for using the finance context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  
  if (context === undefined) {
    console.error('🚨 useFinance: Context is undefined - must be used within a FinanceProvider');
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  
  return context;
};
