
import { useCallback } from 'react';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { DateRange as FinancialDateRange } from '@/types/financial';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';

interface UseDateRangeManagerProps {
  dateRange: FinancialDateRange;
  updateDateRange: (newRange: FinancialDateRange) => void;
  getCurrentMonthRange: () => FinancialDateRange;
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
