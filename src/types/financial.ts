
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  source: 'Zoho' | 'Stripe';
  type: 'income' | 'expense';
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  collaboratorExpense: number;
  otherExpense: number;
  profit: number;
  profitMargin: number;
  startingBalance?: number; // Added starting balance field
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  date?: string; // Fecha opcional para los colaboradores
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
  stripe_override: number | null;
  created_at: string;
  updated_at: string;
}
