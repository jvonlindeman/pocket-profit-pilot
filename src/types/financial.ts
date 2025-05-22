
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
}

/**
 * Date Range type
 * Defines a date range for filtering financial data
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}
