
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
  collaboratorExpense: number; // New field for collaborator expenses
  otherExpense: number; // New field for non-collaborator expenses
  profit: number;
  profitMargin: number;
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
