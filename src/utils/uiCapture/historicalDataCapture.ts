
import { MonthlyFinancialSummary, MonthlyAggregationService } from '@/services/monthlyAggregationService';

export interface HistoricalFinancialContext {
  monthlyHistory: MonthlyFinancialSummary[];
  currentPeriod: {
    year: number;
    month: number;
  };
  trends: {
    overallIncomesTrend: string;
    overallExpensesTrend: string;
    overallProfitTrend: string;
    volatility: number;
  };
  seasonalPatterns: {
    highestIncomeMonth: number;
    lowestIncomeMonth: number;
    highestExpenseMonth: number;
    lowestExpenseMonth: number;
    averageMonthlyProfit: number;
  };
}

/**
 * Captures historical financial data for AI context
 */
export const captureHistoricalFinancialData = async (
  dateRange?: { startDate: Date | null; endDate: Date | null }
): Promise<HistoricalFinancialContext | null> => {
  try {
    console.log('Capturing historical financial data for AI context...');
    
    // Get historical monthly summaries using static method
    const monthlyHistory = await MonthlyAggregationService.getHistoricalSummaries(12);
    
    if (monthlyHistory.length === 0) {
      console.log('No historical data available, triggering backfill...');
      // Trigger backfill but don't wait for it to complete
      MonthlyAggregationService.backfillHistoricalSummaries()
        .then(result => console.log('Backfill completed:', result))
        .catch(err => console.error('Backfill failed:', err));
      
      return null;
    }

    // Determine current period
    const currentDate = dateRange?.startDate || new Date();
    const currentPeriod = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
    };

    // Analyze trends
    const trends = analyzeOverallTrends(monthlyHistory);
    
    // Identify seasonal patterns
    const seasonalPatterns = identifySeasonalPatterns(monthlyHistory);

    const context: HistoricalFinancialContext = {
      monthlyHistory,
      currentPeriod,
      trends,
      seasonalPatterns
    };

    console.log('Historical financial context captured:', {
      monthsAvailable: monthlyHistory.length,
      currentPeriod,
      trends: trends.overallProfitTrend
    });

    return context;
  } catch (err) {
    console.error('Error capturing historical financial data:', err);
    return null;
  }
};

/**
 * Analyze overall trends across historical data
 */
function analyzeOverallTrends(history: MonthlyFinancialSummary[]) {
  if (history.length < 3) {
    return {
      overallIncomesTrend: 'insufficient_data',
      overallExpensesTrend: 'insufficient_data',
      overallProfitTrend: 'insufficient_data',
      volatility: 0
    };
  }

  // Calculate trend direction by comparing first and last quarters
  const firstQuarter = history.slice(-3);
  const lastQuarter = history.slice(0, 3);

  const avgIncomeFirst = firstQuarter.reduce((sum, m) => sum + m.total_income, 0) / firstQuarter.length;
  const avgIncomeLast = lastQuarter.reduce((sum, m) => sum + m.total_income, 0) / lastQuarter.length;
  
  const avgExpenseFirst = firstQuarter.reduce((sum, m) => sum + m.total_expense, 0) / firstQuarter.length;
  const avgExpenseLast = lastQuarter.reduce((sum, m) => sum + m.total_expense, 0) / lastQuarter.length;
  
  const avgProfitFirst = firstQuarter.reduce((sum, m) => sum + m.profit, 0) / firstQuarter.length;
  const avgProfitLast = lastQuarter.reduce((sum, m) => sum + m.profit, 0) / lastQuarter.length;

  // Calculate volatility (standard deviation of profit margins)
  const profitMargins = history.map(m => m.profit_margin);
  const avgMargin = profitMargins.reduce((sum, m) => sum + m, 0) / profitMargins.length;
  const variance = profitMargins.reduce((sum, m) => sum + Math.pow(m - avgMargin, 2), 0) / profitMargins.length;
  const volatility = Math.sqrt(variance);

  return {
    overallIncomesTrend: avgIncomeLast > avgIncomeFirst * 1.05 ? 'growing' : 
                        avgIncomeLast < avgIncomeFirst * 0.95 ? 'declining' : 'stable',
    overallExpensesTrend: avgExpenseLast > avgExpenseFirst * 1.05 ? 'growing' : 
                         avgExpenseLast < avgExpenseFirst * 0.95 ? 'declining' : 'stable',
    overallProfitTrend: avgProfitLast > avgProfitFirst * 1.05 ? 'growing' : 
                       avgProfitLast < avgProfitFirst * 0.95 ? 'declining' : 'stable',
    volatility: Math.round(volatility * 100) / 100
  };
}

/**
 * Identify seasonal patterns in the data
 */
function identifySeasonalPatterns(history: MonthlyFinancialSummary[]) {
  if (history.length === 0) {
    return {
      highestIncomeMonth: 0,
      lowestIncomeMonth: 0,
      highestExpenseMonth: 0,
      lowestExpenseMonth: 0,
      averageMonthlyProfit: 0
    };
  }

  // Group by month to identify seasonal patterns
  const monthlyAverage: Record<number, { income: number; expense: number; count: number }> = {};
  
  history.forEach(m => {
    if (!monthlyAverage[m.month]) {
      monthlyAverage[m.month] = { income: 0, expense: 0, count: 0 };
    }
    monthlyAverage[m.month].income += m.total_income;
    monthlyAverage[m.month].expense += m.total_expense;
    monthlyAverage[m.month].count += 1;
  });

  // Calculate averages
  Object.keys(monthlyAverage).forEach(month => {
    const monthNum = parseInt(month);
    monthlyAverage[monthNum].income /= monthlyAverage[monthNum].count;
    monthlyAverage[monthNum].expense /= monthlyAverage[monthNum].count;
  });

  // Find peaks
  let highestIncomeMonth = 1;
  let lowestIncomeMonth = 1;
  let highestExpenseMonth = 1;
  let lowestExpenseMonth = 1;
  let maxIncome = 0;
  let minIncome = Infinity;
  let maxExpense = 0;
  let minExpense = Infinity;

  Object.entries(monthlyAverage).forEach(([month, data]) => {
    const monthNum = parseInt(month);
    if (data.income > maxIncome) {
      maxIncome = data.income;
      highestIncomeMonth = monthNum;
    }
    if (data.income < minIncome) {
      minIncome = data.income;
      lowestIncomeMonth = monthNum;
    }
    if (data.expense > maxExpense) {
      maxExpense = data.expense;
      highestExpenseMonth = monthNum;
    }
    if (data.expense < minExpense) {
      minExpense = data.expense;
      lowestExpenseMonth = monthNum;
    }
  });

  const averageMonthlyProfit = history.reduce((sum, m) => sum + m.profit, 0) / history.length;

  return {
    highestIncomeMonth,
    lowestIncomeMonth,
    highestExpenseMonth,
    lowestExpenseMonth,
    averageMonthlyProfit: Math.round(averageMonthlyProfit * 100) / 100
  };
}
