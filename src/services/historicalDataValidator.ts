
import { supabase } from '@/integrations/supabase/client';
import { MonthlyAggregationService } from './monthlyAggregationService';

export interface HistoricalDataStatus {
  isComplete: boolean;
  missingMonths: Array<{ year: number; month: number }>;
  totalMonths: number;
  availableMonths: number;
  lastUpdate: string | null;
}

export class HistoricalDataValidator {
  
  /**
   * Validates the completeness of historical data
   */
  static async validateHistoricalData(monthsBack: number = 12): Promise<HistoricalDataStatus> {
    try {
      console.log('Validating historical data completeness...');
      
      // Generate expected months
      const expectedMonths = this.generateExpectedMonths(monthsBack);
      
      // Get available monthly summaries
      const availableSummaries = await MonthlyAggregationService.getHistoricalSummaries(monthsBack);
      
      // Find missing months
      const availableKeys = new Set(
        availableSummaries.map(s => `${s.year}-${s.month}`)
      );
      
      const missingMonths = expectedMonths.filter(
        month => !availableKeys.has(`${month.year}-${month.month}`)
      );
      
      // Get last update timestamp
      const lastUpdate = availableSummaries.length > 0 
        ? availableSummaries[0].updated_at 
        : null;
      
      const status: HistoricalDataStatus = {
        isComplete: missingMonths.length === 0,
        missingMonths,
        totalMonths: expectedMonths.length,
        availableMonths: availableSummaries.length,
        lastUpdate
      };
      
      console.log('Historical data validation result:', {
        complete: status.isComplete,
        available: status.availableMonths,
        total: status.totalMonths,
        missing: status.missingMonths.length
      });
      
      return status;
    } catch (error) {
      console.error('Error validating historical data:', error);
      throw new Error('Failed to validate historical data');
    }
  }
  
  /**
   * Attempts to backfill missing historical data
   */
  static async backfillMissingData(): Promise<{ success: boolean; processed: number; errors: number }> {
    try {
      console.log('Starting historical data backfill...');
      
      const result = await MonthlyAggregationService.backfillHistoricalSummaries();
      
      console.log('Backfill completed:', result);
      return result;
    } catch (error) {
      console.error('Error during historical data backfill:', error);
      return { success: false, processed: 0, errors: 1 };
    }
  }
  
  /**
   * Generates array of expected months going back from current date
   */
  private static generateExpectedMonths(monthsBack: number): Array<{ year: number; month: number }> {
    const months: Array<{ year: number; month: number }> = [];
    const currentDate = new Date();
    
    for (let i = 0; i < monthsBack; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1
      });
    }
    
    return months;
  }
  
  /**
   * Validates data integrity for a specific month
   */
  static async validateMonthIntegrity(year: number, month: number): Promise<boolean> {
    try {
      // Check if we have cached transactions for this month
      const { data: transactions, error } = await supabase
        .from('cached_transactions')
        .select('id', { count: 'exact' })
        .eq('year', year)
        .eq('month', month);
      
      if (error) {
        console.error('Error checking month integrity:', error);
        return false;
      }
      
      // Check if we have monthly summary for this month
      const { data: summary, error: summaryError } = await supabase
        .from('monthly_financial_summaries')
        .select('id')
        .eq('year', year)
        .eq('month', month)
        .single();
      
      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error checking monthly summary:', summaryError);
        return false;
      }
      
      const hasTransactions = (transactions?.length || 0) > 0;
      const hasSummary = !!summary;
      
      console.log(`Month ${year}-${month} integrity: transactions=${hasTransactions}, summary=${hasSummary}`);
      
      return hasTransactions === hasSummary; // Both should exist or both should not exist
    } catch (error) {
      console.error('Error validating month integrity:', error);
      return false;
    }
  }
}
