
import { FinancialData } from '@/types/financial';

// API timeout in milliseconds
export const API_TIMEOUT_MS = 30000; // 30 seconds

// Default financial data for initialization
export const DEFAULT_FINANCIAL_DATA = emptyFinancialData;

// Empty financial data object to use as initial state
export const emptyFinancialData: FinancialData = {
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    collaboratorExpense: 0,
    otherExpense: 0,
    profit: 0,
    profitMargin: 0
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
