
import { useCallback } from 'react';
import { financialSummaryService } from '@/services/financialSummaryService';
import { FinancialData, DateRange } from '@/types/financial';

/**
 * Hook for persisting financial data
 */
export const useFinancialPersistence = () => {
  /**
   * Save financial data to local storage
   */
  const saveFinancialData = useCallback((
    financialData: FinancialData,
    dateRange: DateRange,
    transactionCount: number,
    isLoading: boolean
  ) => {
    // Skip saving if we're loading or no data is available
    if (isLoading || !financialData) return;
    
    // Skip if there are no transactions
    if (transactionCount === 0) {
      console.log("useFinancialPersistence - No transactions to save");
      return;
    }
    
    // Ensure we have valid date range
    if (!dateRange.startDate || !dateRange.endDate) {
      console.warn("useFinancialPersistence - Invalid date range:", dateRange);
      return;
    }
    
    // Save the financial summary
    try {
      financialSummaryService.saveFinancialSummary({
        summary: financialData.summary,
        dateRange,
        transactionCount
      });
    } catch (error) {
      console.error("useFinancialPersistence - Error saving financial data:", error);
    }
  }, []);
  
  return { saveFinancialData };
};
