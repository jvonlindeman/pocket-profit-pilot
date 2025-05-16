
import { useCallback } from 'react';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';

interface UseDateRangeManagerProps {
  dateRange: { startDate: Date; endDate: Date };
  updateDateRange: (newRange: { startDate: Date; endDate: Date }) => void;
  getCurrentMonthRange: () => { startDate: Date; endDate: Date };
}

export function useDateRangeManager({
  dateRange,
  updateDateRange,
  getCurrentMonthRange
}: UseDateRangeManagerProps) {
  // Handler for date range change
  const handleDateRangeChange = useCallback((newRange: DayPickerDateRange) => {
    if (newRange.from && newRange.to) {
      updateDateRange(toFinancialDateRange(newRange));
    }
  }, [updateDateRange]);

  // Map the current month range function to match DateRangePicker's expected format
  const getDatePickerCurrentMonthRange = useCallback(() => {
    const financialDateRange = getCurrentMonthRange();
    return toDayPickerDateRange(financialDateRange);
  }, [getCurrentMonthRange]);
  
  return {
    handleDateRangeChange,
    getDatePickerCurrentMonthRange
  };
}
