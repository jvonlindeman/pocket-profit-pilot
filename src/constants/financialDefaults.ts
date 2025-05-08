
import { FinancialData } from '@/types/financial';

// Default financial data structure
export const DEFAULT_FINANCIAL_DATA: FinancialData = {
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    collaboratorExpense: 0,
    otherExpense: 0,
    profit: 0,
    profitMargin: 0,
  },
  transactions: [],
  incomeBySource: [],
  expenseByCategory: [],
  dailyData: {
    income: { labels: [], values: [] },
    expense: { labels: [], values: [] }
  },
  monthlyData: {
    income: { labels: [], values: [] },
    expense: { labels: [], values: [] },
    profit: { labels: [], values: [] }
  }
};

// Timeout duration for API calls (in milliseconds)
export const API_TIMEOUT_MS = 30000;
