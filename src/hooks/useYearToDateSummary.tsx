import { useMemo } from 'react';
import { Transaction } from '@/types/financial';
import { MonthlyBreakdown, YearToDateMetrics } from '@/components/Dashboard/YearToDateSummary/types';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface UseYearToDateSummaryParams {
  transactions: Transaction[];
  stripeIncome: number;
  stripeFees: number;
  stripeNet: number;
  zohoIncome: number;
  totalZohoExpenses: number;
}

export function useYearToDateSummary({
  transactions,
  stripeIncome,
  stripeFees,
  stripeNet,
  zohoIncome,
  totalZohoExpenses
}: UseYearToDateSummaryParams): YearToDateMetrics {
  return useMemo(() => {
    // Group transactions by month
    const monthlyData: Record<number, { income: number; expense: number }> = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const month = date.getMonth() + 1; // 1-12
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      
      if (tx.type === 'income') {
        monthlyData[month].income += tx.amount;
      } else {
        monthlyData[month].expense += Math.abs(tx.amount);
      }
    });
    
    // Convert to array for charts
    const monthlyBreakdown: MonthlyBreakdown[] = Object.entries(monthlyData)
      .map(([monthStr, data]) => {
        const month = parseInt(monthStr);
        return {
          month,
          monthName: MONTH_NAMES[month - 1],
          income: data.income,
          expense: data.expense,
          profit: data.income - data.expense
        };
      })
      .sort((a, b) => a.month - b.month);
    
    // Calculate totals
    const totalIncome = stripeNet + zohoIncome;
    const totalExpense = totalZohoExpenses;
    const totalProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;
    
    // Find best and worst months
    let bestMonth: { month: string; profit: number } | null = null;
    let worstMonth: { month: string; profit: number } | null = null;
    
    if (monthlyBreakdown.length > 0) {
      const sorted = [...monthlyBreakdown].sort((a, b) => b.profit - a.profit);
      bestMonth = {
        month: sorted[0].monthName,
        profit: sorted[0].profit
      };
      worstMonth = {
        month: sorted[sorted.length - 1].monthName,
        profit: sorted[sorted.length - 1].profit
      };
    }
    
    // Calculate averages
    const monthCount = monthlyBreakdown.length || 1;
    const averageMonthlyIncome = totalIncome / monthCount;
    const averageMonthlyExpense = totalExpense / monthCount;
    
    // Calculate MoM growth (comparing last two months with data)
    let momGrowth = 0;
    if (monthlyBreakdown.length >= 2) {
      const lastMonth = monthlyBreakdown[monthlyBreakdown.length - 1];
      const prevMonth = monthlyBreakdown[monthlyBreakdown.length - 2];
      if (prevMonth.income > 0) {
        momGrowth = ((lastMonth.income - prevMonth.income) / prevMonth.income) * 100;
      }
    }
    
    // Calculate source percentages
    const stripePercentage = totalIncome > 0 ? (stripeNet / totalIncome) * 100 : 0;
    const zohoPercentage = totalIncome > 0 ? (zohoIncome / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpense,
      totalProfit,
      profitMargin,
      stripeIncome,
      stripeFees,
      stripeNet,
      zohoIncome,
      monthlyBreakdown,
      bestMonth,
      worstMonth,
      averageMonthlyIncome,
      averageMonthlyExpense,
      momGrowth,
      stripePercentage,
      zohoPercentage
    };
  }, [transactions, stripeIncome, stripeFees, stripeNet, zohoIncome, totalZohoExpenses]);
}
