
import { supabase } from "@/integrations/supabase/client";
import { FinancialSummary, CategorySummary } from "@/types/financial";
import { toast } from "@/hooks/use-toast";

interface StoredFinancialSummary {
  id: string;
  date_range_start: string;
  date_range_end: string;
  total_income: number;
  total_expense: number;
  collaborator_expense: number;
  other_expense: number;
  profit: number;
  profit_margin: number;
  starting_balance: number | null;
  created_at: string;
  updated_at: string;
  cache_segment_id: string | null;
  metadata: any;
}

/**
 * Service to handle storage and retrieval of financial summaries
 */
export class FinancialSummaryService {
  /**
   * Save a financial summary to the database
   */
  async saveFinancialSummary(
    summary: FinancialSummary, 
    startDate: Date, 
    endDate: Date,
    cacheSegmentId?: string
  ): Promise<string | null> {
    try {
      console.log("Saving financial summary to database:", {
        summary, 
        startDate, 
        endDate, 
        cacheSegmentId
      });

      // Convert Date objects to ISO strings for database storage
      const dateRangeStart = startDate.toISOString().split('T')[0];
      const dateRangeEnd = endDate.toISOString().split('T')[0];
      
      // Check if a summary for this date range already exists
      const { data: existingSummary } = await supabase
        .from('financial_summaries')
        .select('id')
        .eq('date_range_start', dateRangeStart)
        .eq('date_range_end', dateRangeEnd)
        .maybeSingle();
      
      if (existingSummary) {
        // Update existing summary
        const { data, error } = await supabase
          .from('financial_summaries')
          .update({
            total_income: summary.totalIncome,
            total_expense: summary.totalExpense,
            collaborator_expense: summary.collaboratorExpense,
            other_expense: summary.otherExpense,
            profit: summary.profit,
            profit_margin: summary.profitMargin,
            starting_balance: summary.startingBalance || 0,
            cache_segment_id: cacheSegmentId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSummary.id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating financial summary:", error);
          return null;
        }
        
        console.log("Financial summary updated:", data);
        return data.id;
      } else {
        // Insert new summary
        const { data, error } = await supabase
          .from('financial_summaries')
          .insert({
            date_range_start: dateRangeStart,
            date_range_end: dateRangeEnd,
            total_income: summary.totalIncome,
            total_expense: summary.totalExpense,
            collaborator_expense: summary.collaboratorExpense,
            other_expense: summary.otherExpense,
            profit: summary.profit,
            profit_margin: summary.profitMargin,
            starting_balance: summary.startingBalance || 0,
            cache_segment_id: cacheSegmentId || null
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error saving financial summary:", error);
          return null;
        }
        
        console.log("New financial summary saved:", data);
        return data.id;
      }
    } catch (err) {
      console.error("Exception saving financial summary:", err);
      return null;
    }
  }
  
  /**
   * Get financial summaries for a date range
   */
  async getFinancialSummaries(
    startDate: Date, 
    endDate: Date
  ): Promise<StoredFinancialSummary[]> {
    try {
      // Convert Date objects to ISO strings for database query
      const dateRangeStart = startDate.toISOString().split('T')[0];
      const dateRangeEnd = endDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('financial_summaries')
        .select('*')
        .gte('date_range_start', dateRangeStart)
        .lte('date_range_end', dateRangeEnd)
        .order('date_range_start', { ascending: true });
        
      if (error) {
        console.error("Error retrieving financial summaries:", error);
        return [];
      }
      
      return data as StoredFinancialSummary[];
    } catch (err) {
      console.error("Exception retrieving financial summaries:", err);
      return [];
    }
  }
  
  /**
   * Convert a stored summary to the application format
   */
  convertToAppFormat(storedSummary: StoredFinancialSummary): FinancialSummary {
    return {
      totalIncome: Number(storedSummary.total_income),
      totalExpense: Number(storedSummary.total_expense),
      collaboratorExpense: Number(storedSummary.collaborator_expense),
      otherExpense: Number(storedSummary.other_expense),
      profit: Number(storedSummary.profit),
      profitMargin: Number(storedSummary.profit_margin),
      grossProfit: Number(storedSummary.total_income),
      grossProfitMargin: storedSummary.total_income > 0 ? 100 : 0,
      startingBalance: storedSummary.starting_balance !== null ? Number(storedSummary.starting_balance) : undefined,
      startDate: new Date(storedSummary.date_range_start),
      endDate: new Date(storedSummary.date_range_end)
    };
  }
}

// Export a singleton instance
export const financialSummaryService = new FinancialSummaryService();
