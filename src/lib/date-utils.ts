
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
