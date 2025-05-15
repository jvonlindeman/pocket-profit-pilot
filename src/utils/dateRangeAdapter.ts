
import { DateRange as DayPickerDateRange } from "react-day-picker";
import { DateRange as FinancialDateRange } from "../types/financial";

/**
 * Convert from DayPicker's DateRange to our FinancialDateRange
 * with robust null/undefined handling
 */
export function toFinancialDateRange(dayPickerRange: DayPickerDateRange | undefined): FinancialDateRange {
  // Default to today if no range or dates are provided
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  
  if (!dayPickerRange) {
    return {
      startDate: today,
      endDate: today,
    };
  }
  
  return {
    startDate: dayPickerRange.from || today,
    endDate: dayPickerRange.to || today,
  };
}

/**
 * Convert from our FinancialDateRange to DayPicker's DateRange
 * with robust null/undefined handling
 */
export function toDayPickerDateRange(financialRange: FinancialDateRange | undefined): DayPickerDateRange {
  // Default to today if no range or dates are provided
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  
  if (!financialRange) {
    return {
      from: today,
      to: today,
    };
  }
  
  return {
    from: financialRange.startDate || today,
    to: financialRange.endDate || today,
  };
}

/**
 * Create a safe day picker date range that won't be empty
 */
export function createSafeDayPickerDateRange(range: DayPickerDateRange | undefined): DayPickerDateRange {
  if (!range || (!range.from && !range.to)) {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    return {
      from: today,
      to: today,
    };
  }
  return range;
}

/**
 * Ensure both dates in a DateRange are valid Date objects
 */
export function validateDateRange<T extends {from?: Date | null, to?: Date | null} | {startDate?: Date | null, endDate?: Date | null}>(range: T): T {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  
  if ('from' in range && 'to' in range) {
    // It's a DayPicker DateRange
    return {
      ...range,
      from: (range.from && !isNaN(range.from.getTime())) ? range.from : today,
      to: (range.to && !isNaN(range.to.getTime())) ? range.to : today,
    } as T;
  } else if ('startDate' in range && 'endDate' in range) {
    // It's a FinancialDateRange
    return {
      ...range,
      startDate: (range.startDate && !isNaN(range.startDate.getTime())) ? range.startDate : today,
      endDate: (range.endDate && !isNaN(range.endDate.getTime())) ? range.endDate : today,
    } as T;
  }
  
  // If we can't determine the type, return as is
  return range;
}
