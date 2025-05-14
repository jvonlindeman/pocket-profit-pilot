
import { DateRange as DayPickerDateRange } from "react-day-picker";

// The DateRange type from our financial.ts
export interface FinancialDateRange {
  startDate: Date;
  endDate: Date;
}

// Convert from DayPicker's DateRange to our FinancialDateRange
export function toFinancialDateRange(dayPickerRange: DayPickerDateRange): FinancialDateRange {
  return {
    startDate: dayPickerRange.from || new Date(),
    endDate: dayPickerRange.to || new Date(),
  };
}

// Convert from our FinancialDateRange to DayPicker's DateRange
export function toDayPickerDateRange(financialRange: FinancialDateRange): DayPickerDateRange {
  return {
    from: financialRange.startDate,
    to: financialRange.endDate,
  };
}

// Create a safe day picker date range that won't be empty
export function createSafeDayPickerDateRange(range: DayPickerDateRange | undefined): DayPickerDateRange {
  if (!range || (!range.from && !range.to)) {
    const today = new Date();
    return {
      from: today,
      to: today,
    };
  }
  return range;
}
