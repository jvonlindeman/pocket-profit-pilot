
/**
 * Transaction type
 * Defines the structure of financial transactions in the app
 */
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category?: string;
  source: string;
  type: 'income' | 'expense';
  fees?: number;
  gross?: number;
  metadata?: Record<string, any>;
  external_id?: string; // Added to fix TypeScript errors
}

/**
 * Financial summary type
 * Provides an aggregated view of financial data
 */
export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  profitMargin: number;
  startDate: Date;
  endDate: Date;
  collaboratorExpense: number; // Added missing property
  otherExpense: number; // Added missing property
  grossProfit: number; // Added missing property
  grossProfitMargin: number; // Added missing property
  startingBalance?: number; // Added missing property
}

/**
 * Financial data type for processed transactions
 */
export interface FinancialData {
  summary: FinancialSummary;
  incomeBySource: CategorySummary[];
  expenseByCategory: CategorySummary[];
}

/**
 * Monthly Balance type for tracking monthly financial data
 */
export interface MonthlyBalance {
  id?: number;
  month_year: string;
  balance: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  stripe_override?: number;
  itbm_amount?: number;
  opex_amount?: number;
  profit_percentage?: number;
}

/**
 * Monthly Data type
 * Represents monthly financial data for charts and analysis
 */
export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

/**
 * Vendor Expense type
 * Represents expenses grouped by vendor
 */
export interface VendorExpense {
  vendor: string;
  amount: number;
  percentage: number;
}

/**
 * Category Summary type
 * Represents financial data grouped by category
 */
export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count?: number; // Added missing property
}

/**
 * Date Range type
 * Defines a date range for filtering financial data
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}
