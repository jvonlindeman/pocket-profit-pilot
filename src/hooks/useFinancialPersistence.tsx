
import { useCallback } from 'react';
import { financialService } from '@/services/financialService';
import { FinancialData } from '@/types/financial';
import { toast } from "@/hooks/use-toast";
import { useCacheSegments } from '@/hooks/cache/useCacheSegments';

/**
 * Hook to handle persistence of financial data
 */
export const useFinancialPersistence = () => {
  const { getCacheSegmentIds } = useCacheSegments();

  /**
   * Save financial data to database with appropriate cache segment ID
   */
  const saveFinancialData = useCallback(async (
    financialData: FinancialData,
    dateRange: { startDate: Date; endDate: Date },
    transactionsLength: number,
    loading: boolean
  ) => {
    // Only save when we have actual financial data and valid date range
    if (
      financialData && 
      financialData.summary && 
      dateRange.startDate && 
      dateRange.endDate && 
      transactionsLength > 0 && 
      !loading
    ) {
      console.log("Saving financial data to database:", { 
        financialData,
        dateRange
      });
      
      // Get the cache segment ID before saving the financial summary
      const { zoho, stripe } = await getCacheSegmentIds(dateRange);
      
      // Prefer Zoho if available, otherwise use Stripe if available
      const cacheSegmentId = zoho || stripe || null;
      
      console.log("Using cache segment ID for saving financial summary:", cacheSegmentId);
      
      financialService.saveFinancialSummary(financialData, dateRange, cacheSegmentId)
        .then(summaryId => {
          if (summaryId) {
            console.log("Financial summary saved with ID:", summaryId);
          } else {
            console.warn("Failed to save financial summary");
          }
        })
        .catch(err => {
          console.error("Error saving financial summary:", err);
        });
    }
  }, [getCacheSegmentIds]);

  return { saveFinancialData };
};
