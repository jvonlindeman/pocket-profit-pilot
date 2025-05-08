
import { useState, useCallback } from 'react';
import { formatISO, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { DateRange } from '@/types/financial';

export const useDateRange = () => {
  // Initialize with the current month
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    return {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    };
  });

  // Get the current month range
  const getCurrentMonthRange = useCallback(() => {
    const today = new Date();
    return {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    };
  }, []);

  // Update the date range
  const updateDateRange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  // Check if a date is within the current range
  const isDateInRange = useCallback(
    (date: string) => {
      const parsedDate = new Date(date);
      return (
        !isBefore(parsedDate, dateRange.startDate) &&
        !isAfter(parsedDate, dateRange.endDate)
      );
    },
    [dateRange]
  );

  // Format date range for API requests
  const getFormattedDateRange = useCallback(() => {
    return {
      startDate: formatISO(dateRange.startDate, { representation: 'date' }),
      endDate: formatISO(dateRange.endDate, { representation: 'date' }),
    };
  }, [dateRange]);

  return {
    dateRange,
    updateDateRange,
    getCurrentMonthRange,
    isDateInRange,
    getFormattedDateRange,
  };
};
