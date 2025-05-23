
import { useState, useCallback, useEffect } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Hook to manage date ranges for financial data
 */
export const useFinanceDateRange = (fetchMonthlyBalance: (date: Date) => void) => {
  // Date range state - initialized to current month (first day to last day)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // First day of current month
    const startDate = startOfMonth(today);
    // Last day of current month
    const endDate = endOfMonth(today);
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Function to update date range
  const updateDateRange = useCallback((newRange: { startDate: Date; endDate: Date }) => {
    console.log("Date range updated:", newRange);
    
    // Create shallow copies to preserve the exact selected dates
    const preservedStartDate = new Date(newRange.startDate);
    const preservedEndDate = new Date(newRange.endDate);
    
    setDateRange({
      startDate: preservedStartDate,
      endDate: preservedEndDate
    });

    // Fetch monthly balance when date range changes
    fetchMonthlyBalance(preservedStartDate);
    
    // Cache refresh functionality has been removed as per simplification plan
  }, [fetchMonthlyBalance]);

  // When dateRange changes, make sure we fetch monthly balance
  useEffect(() => {
    fetchMonthlyBalance(dateRange.startDate);
  }, [dateRange.startDate, fetchMonthlyBalance]);

  return {
    dateRange,
    updateDateRange
  };
};
