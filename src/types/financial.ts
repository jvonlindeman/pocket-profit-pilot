export interface Transaction {
  id: string;
  external_id?: string; // Added external_id as optional field
  date: string;
  amount: number;
  description: string;
  category: string;
  source: 'Zoho' | 'Stripe';
  type: 'income' | 'expense';
  fees?: number; // Added optional fees field
  gross?: number; // Added optional gross amount field (before fees)
  metadata?: any; // Added metadata field for additional properties
}

export interface UnpaidInvoice {
  customer_name: string;
  company_name?: string;
  balance: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  collaboratorExpense: number;
  otherExpense: number;
  profit: number;
  profitMargin: number;
  grossProfit: number; // Added gross profit field 
  grossProfitMargin: number; // Added gross profit margin field
  startingBalance?: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  date?: string; // Fecha opcional para los colaboradores
  count?: number; // Added count property for number of transactions in category
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
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
  unpaidInvoices?: UnpaidInvoice[]; // Added unpaid invoices
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

export interface CollaboratorData {
  name: string;
  amount: number;
  percentage: number;
  date?: string; // Fecha opcional para los colaboradores
}

export interface MonthlyBalance {
  id: number;
  month_year: string;
  balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stripe_override: number | null; // Added to match the database schema
  opex_amount: number | null; // Added for OPEX percentage
  itbm_amount: number | null; // Added for ITBM amount
  profit_percentage: number | null; // Added for Profit First percentage
}
