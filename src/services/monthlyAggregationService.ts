import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/financial';

export interface MonthlyFinancialSummary {
  id?: string;
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
  collaborator_expense: number;
  other_expense: number;
  profit: number;
  profit_margin: number;
  starting_balance?: number;
  transaction_count: number;
  mom_income_change?: number;
  mom_expense_change?: number;
  mom_profit_change?: number;
  income_trend?: string;
  expense_trend?: string;
  profit_trend?: string;
  data_sources?: string[];
  cache_segment_ids?: string[];
}

/**
 * Service to aggregate transaction data into monthly summaries
 */
export class MonthlyAggregationService {
  /**
   * Compute monthly summary from transactions
   */
  static computeMonthlySummary(
    transactions: Transaction[],
    year: number,
    month: number,
    startingBalance: number = 0
  ): MonthlyFinancialSummary {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Separate collaborator expenses (you may need to adjust this logic based on your categorization)
    const collaboratorExpense = expenses
      .filter(t => t.category?.toLowerCase().includes('colaborador') || 
                   t.description?.toLowerCase().includes('colaborador'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const otherExpense = totalExpense - collaboratorExpense;
    const profit = income - totalExpense;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;
    
    const sources = [...new Set(transactions.map(t => t.source))];
    
    return {
      year,
      month,
      total_income: income,
      total_expense: totalExpense,
      collaborator_expense: collaboratorExpense,
      other_expense: otherExpense,
      profit,
      profit_margin: profitMargin,
      starting_balance: startingBalance,
      transaction_count: transactions.length,
      data_sources: sources
    };
  }

  /**
   * Store or update monthly summary in database
   */
  static async storeMonthlySection(summary: MonthlyFinancialSummary): Promise<boolean> {
    try {
      console.log(`Storing monthly summary for ${summary.year}-${summary.month}`);
      
      const { error } = await supabase
        .from('monthly_financial_summaries')
        .upsert({
          year: summary.year,
          month: summary.month,
          total_income: summary.total_income,
          total_expense: summary.total_expense,
          collaborator_expense: summary.collaborator_expense,
          other_expense: summary.other_expense,
          profit: summary.profit,
          profit_margin: summary.profit_margin,
          starting_balance: summary.starting_balance || 0,
          transaction_count: summary.transaction_count,
          data_sources: summary.data_sources || [],
          cache_segment_ids: summary.cache_segment_ids || [],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'year,month'
        });

      if (error) {
        console.error('Error storing monthly summary:', error);
        return false;
      }

      // Calculate trends after storing
      await this.calculateTrends(summary.year, summary.month);
      
      console.log(`Successfully stored monthly summary for ${summary.year}-${summary.month}`);
      return true;
    } catch (err) {
      console.error('Exception storing monthly summary:', err);
      return false;
    }
  }

  /**
   * Calculate month-over-month trends
   */
  static async calculateTrends(year: number, month: number): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('calculate_monthly_trends', {
        target_year: year,
        target_month: month
      });

      if (error) {
        console.error('Error calculating trends:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Exception calculating trends:', err);
      return false;
    }
  }

  /**
   * Get historical monthly summaries for AI context
   */
  static async getHistoricalSummaries(monthsBack: number = 12): Promise<MonthlyFinancialSummary[]> {
    try {
      const { data, error } = await supabase.rpc('get_monthly_summaries_for_ai', {
        months_back: monthsBack
      });

      if (error) {
        console.error('Error fetching historical summaries:', error);
        return [];
      }

      // Map the data to include missing fields
      return (data || []).map((item: any): MonthlyFinancialSummary => ({
        year: item.year,
        month: item.month,
        total_income: Number(item.total_income),
        total_expense: Number(item.total_expense),
        collaborator_expense: Number(item.collaborator_expense || 0),
        other_expense: Number(item.other_expense || 0),
        profit: Number(item.profit),
        profit_margin: Number(item.profit_margin),
        transaction_count: item.transaction_count,
        mom_income_change: item.mom_income_change ? Number(item.mom_income_change) : undefined,
        mom_expense_change: item.mom_expense_change ? Number(item.mom_expense_change) : undefined,
        mom_profit_change: item.mom_profit_change ? Number(item.mom_profit_change) : undefined,
        income_trend: item.income_trend,
        expense_trend: item.expense_trend,
        profit_trend: item.profit_trend
      }));
    } catch (err) {
      console.error('Exception fetching historical summaries:', err);
      return [];
    }
  }

  /**
   * Process transactions and create monthly summary
   */
  static async processTransactionsForMonth(
    transactions: Transaction[],
    year: number,
    month: number,
    startingBalance: number = 0
  ): Promise<boolean> {
    const summary = this.computeMonthlySummary(transactions, year, month, startingBalance);
    return await this.storeMonthlySection(summary);
  }

  /**
   * Backfill historical monthly summaries from monthly_financial_summaries table
   * Note: This method is simplified since cached_transactions table was removed
   */
  static async backfillHistoricalSummaries(): Promise<{ processed: number; errors: number }> {
    try {
      console.log('Backfill not available - cached_transactions table was removed');
      console.log('Use processTransactionsForMonth with live data instead');
      return { processed: 0, errors: 0 };
    } catch (err) {
      console.error('Exception in backfill:', err);
      return { processed: 0, errors: 1 };
    }
  }
}

export const monthlyAggregationService = new MonthlyAggregationService();
