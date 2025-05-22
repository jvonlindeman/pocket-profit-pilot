
import { startOfMonth, endOfMonth, parse, format } from 'date-fns';

/**
 * Get the first and last days of the current month
 */
export function getCurrentMonthRange() {
  const today = new Date();
  const firstDay = startOfMonth(today);
  const lastDay = endOfMonth(today);
  
  return { startDate: firstDay, endDate: lastDay };
}

/**
 * Format a date to the YYYY-MM-DD format
 */
export function formatDateYYYYMMDD(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a date string to a Date object
 */
export function parseDate(dateString: string | Date): Date {
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
}

/**
 * Check if a date is within a specific month
 */
export function isDateWithinMonth(dateToCheck: Date, yearMonth: Date): boolean {
  const start = startOfMonth(yearMonth);
  const end = endOfMonth(yearMonth);
  
  const checkDate = dateToCheck instanceof Date ? dateToCheck : new Date(dateToCheck);
  
  return checkDate >= start && checkDate <= end;
}
