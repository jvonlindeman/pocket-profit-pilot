
import { useState, useEffect, useCallback } from 'react';
import { financialSummaryService } from '@/services/financialSummaryService';
import { FinancialSummary } from '@/types/financial';

interface UseStoredFinancialSummariesProps {
  startDate?: Date;
  endDate?: Date; 
  autoLoad?: boolean;
}

interface UseStoredFinancialSummariesResult {
  summaries: { 
    date: string;
    summary: FinancialSummary;
    id: string; 
  }[];
  loading: boolean;
  error: Error | null;
  loadSummaries: () => Promise<void>;
}

/**
 * Hook to retrieve stored financial summaries from the database
 */
export const useStoredFinancialSummaries = ({
  startDate,
  endDate,
  autoLoad = true
}: UseStoredFinancialSummariesProps = {}): UseStoredFinancialSummariesResult => {
  const [summaries, setSummaries] = useState<{ date: string; summary: FinancialSummary; id: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to load summaries from the database
  const loadSummaries = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const storedSummaries = await financialSummaryService.getFinancialSummaries(
        startDate,
        endDate
      );
      
      // Convert to application format
      const formattedSummaries = storedSummaries.map(stored => ({
        date: stored.date_range_start,
        summary: financialSummaryService.convertToAppFormat(stored),
        id: stored.id
      }));
      
      console.log("Loaded financial summaries:", formattedSummaries);
      setSummaries(formattedSummaries);
    } catch (err) {
      console.error("Error loading stored financial summaries:", err);
      setError(err instanceof Error ? err : new Error('Unknown error loading summaries'));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);
  
  // Load summaries when dates change if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadSummaries();
    }
  }, [loadSummaries, autoLoad]);
  
  return {
    summaries,
    loading,
    error,
    loadSummaries
  };
};
