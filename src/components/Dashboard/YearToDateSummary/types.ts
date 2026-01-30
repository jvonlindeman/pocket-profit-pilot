import { Transaction } from '@/types/financial';

export interface MonthlyBreakdown {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  profit: number;
}

export interface YearToDateMetrics {
  // Totales acumulados
  totalIncome: number;
  totalExpense: number;
  totalProfit: number;
  profitMargin: number;
  
  // Desglose por fuente
  stripeIncome: number;
  stripeFees: number;
  stripeNet: number;
  zohoIncome: number;
  
  // Por mes (para gráficos)
  monthlyBreakdown: MonthlyBreakdown[];
  
  // Estadísticas
  bestMonth: { month: string; profit: number } | null;
  worstMonth: { month: string; profit: number } | null;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  
  // Comparativas
  momGrowth: number; // Month-over-month growth
  stripePercentage: number; // % of income from Stripe
  zohoPercentage: number; // % of income from Zoho
}

export interface YearToDateSummaryProps {
  transactions: Transaction[];
  stripeData: {
    income: number;
    fees: number;
    net: number;
  };
  zohoIncome: number;
  totalZohoExpenses: number;
  collaboratorExpenses: number;
}
