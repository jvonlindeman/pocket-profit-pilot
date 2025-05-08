
import { useState, useCallback } from 'react';
import { formatISO, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { DateRange } from '@/types/financial';
import { formatDateForAPI } from '@/lib/date-utils';

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
    if (!newRange.startDate || !newRange.endDate) {
      console.error('Invalid date range provided:', newRange);
      return;
    }
    console.log('Updating date range:', newRange);
    setDateRange(newRange);
  }, []);

  // Check if a date is within the current range
  const isDateInRange = useCallback(
    (date: string) => {
      if (!date) return false;
      
      try {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          console.error('Invalid date:', date);
          return false;
        }
        
        return (
          !isBefore(parsedDate, dateRange.startDate) &&
          !isAfter(parsedDate, dateRange.endDate)
        );
      } catch (error) {
        console.error('Error checking if date is in range:', error);
        return false;
      }
    },
    [dateRange]
  );

  // Format date range for API requests
  const getFormattedDateRange = useCallback(() => {
    return {
      startDate: formatDateForAPI(dateRange.startDate),
      endDate: formatDateForAPI(dateRange.endDate),
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
