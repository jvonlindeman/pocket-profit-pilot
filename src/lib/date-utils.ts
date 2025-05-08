
import { format, parse, parseISO } from 'date-fns';
import { safeParseNumber, formatCurrency as formatCurrencyUtil } from '@/utils/financialUtils';

/**
 * Format a date string to display format
 * @param dateStr Date string in ISO format
 * @param formatStr Format string for date-fns
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string, formatStr: string = 'PP'): string => {
  try {
    const date = parseISO(dateStr);
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

/**
 * Format a number as currency
 * Wrapper for the financialUtils function for backward compatibility
 */
export const formatCurrency = formatCurrencyUtil;

/**
 * Extract year and month from a date
 * @param date Date object
 * @returns String in "YYYY-MM" format
 */
export const getYearMonth = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

/**
 * Format a date for API requests (YYYY-MM-DD)
 * @param date Date object
 * @returns Formatted date string
 */
export const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Check if a date string is within a date range
 * @param dateStr Date string to check
 * @param startDate Range start date
 * @param endDate Range end date
 * @returns Boolean indicating if date is in range
 */
export const isDateInRange = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  try {
    const date = parseISO(dateStr);
    return date >= startDate && date <= endDate;
  } catch (error) {
    console.error('Error checking date range:', error);
    return false;
  }
};
