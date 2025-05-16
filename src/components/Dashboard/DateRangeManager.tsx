
import React from 'react';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';

interface DateRangeManagerProps {
  dateRange: { startDate: Date; endDate: Date };
  updateDateRange: (newRange: { startDate: Date; endDate: Date }) => void;
  getCurrentMonthRange: () => { startDate: Date; endDate: Date };
  children: (helpers: {
    handleDateRangeChange: (newRange: DayPickerDateRange) => void;
    getDatePickerCurrentMonthRange: () => DayPickerDateRange;
  }) => React.ReactNode;
}

/**
 * DateRangeManager is a wrapper component that provides date range functionality
 * to its children through render props pattern.
 */
const DateRangeManager: React.FC<DateRangeManagerProps> = ({
  dateRange,
  updateDateRange,
  getCurrentMonthRange,
  children
}) => {
  // Handler for date range change
  const handleDateRangeChange = (newRange: DayPickerDateRange) => {
    if (newRange.from && newRange.to) {
      updateDateRange(toFinancialDateRange(newRange));
    }
  };

  // Map the current month range function to match DateRangePicker's expected format
  const getDatePickerCurrentMonthRange = () => {
    const financialDateRange = getCurrentMonthRange();
    return toDayPickerDateRange(financialDateRange);
  };
  
  // Provide the helpers to the children through render props
  return (
    <>
      {children({
        handleDateRangeChange,
        getDatePickerCurrentMonthRange
      })}
    </>
  );
};

export default DateRangeManager;
