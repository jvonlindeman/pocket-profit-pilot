
import { useCallback } from 'react';
import { financialSummaryService } from '@/services/financialSummaryService';
import { FinancialData } from '@/types/financial';

/**
 * Hook for persisting financial data
 */
export const useFinancialPersistence = () => {
  /**
   * Save financial data to local storage
   */
  const saveFinancialData = useCallback((
    financialData: FinancialData
  ) => {
    // Skip if no data is available
    if (!financialData) return;
    
    // Skip if there are no transactions
    if (financialData.transactions.length === 0) {
      console.log("useFinancialPersistence - No transactions to save");
      return;
    }
    
    // Ensure we have valid date range
    if (!financialData.summary.startDate || !financialData.summary.endDate) {
      console.warn("useFinancialPersistence - Invalid date range in summary");
      return;
    }
    
    // Save the financial summary
    try {
      const dateRange = {
        startDate: financialData.summary.startDate,
        endDate: financialData.summary.endDate
      };
      
      financialSummaryService.saveFinancialSummary(
        financialData.summary,
        dateRange.startDate,
        dateRange.endDate
      );
    } catch (error) {
      console.error("useFinancialPersistence - Error saving financial data:", error);
    }
  }, []);
  
  return { saveFinancialData };
};
