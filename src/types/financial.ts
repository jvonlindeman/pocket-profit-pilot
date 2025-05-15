
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  source: string;
  fromCache?: boolean;
  fees?: number;
  gross?: number;
  metadata?: {
    feeType?: 'transaction' | 'payout' | 'stripe';
    [key: string]: any;
  };
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalExpense?: number; // Alias for backward compatibility
  netProfit: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  avgTransactionSize: number;
  // Add missing properties
  collaboratorExpense?: number;
  otherExpense?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  profit?: number;
  profitMargin?: number;
  startingBalance?: number;
}

// Add missing interfaces
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

export interface ChartData {
  labels: string[];
  values: number[];
}

export interface FinancialData {
  summary: FinancialSummary;
  transactions: Transaction[];
  incomeBySource: CategorySummary[];
  expenseByCategory: CategorySummary[];
  dailyData: {
    income: ChartData;
    expense: ChartData;
  };
  monthlyData: {
    income: ChartData;
    expense: ChartData;
    profit: ChartData;
  };
}

export interface MonthlyBalance {
  id: number;
  month_year: string;
  balance: number;
  opex_amount: number;
  itbm_amount: number;
  profit_percentage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  stripe_override?: number;
}

// Function to fix totalExpense vs totalExpenses naming issue
export const normalizeSummary = (summary: FinancialSummary): FinancialSummary => {
  // Ensure both properties exist for backward compatibility
  if (summary.totalExpenses !== undefined && summary.totalExpense === undefined) {
    summary.totalExpense = summary.totalExpenses;
  } else if (summary.totalExpense !== undefined && summary.totalExpenses === undefined) {
    summary.totalExpenses = summary.totalExpense;
  }
  return summary;
};
