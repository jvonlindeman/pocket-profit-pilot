
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
  netProfit: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  avgTransactionSize: number;
}
