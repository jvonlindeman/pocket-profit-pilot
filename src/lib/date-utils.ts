
import { format, parseISO } from 'date-fns';

/**
 * Formats a date string in the user's locale format, properly handling UTC dates
 * 
 * @param dateString A string representing a date in ISO format
 * @param locale Locale to use for formatting (defaults to 'es-ES')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, locale: string = 'es-ES'): string {
  try {
    // Parse the ISO string to a Date object
    const date = parseISO(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error(`Invalid date string: ${dateString}`);
      return 'Invalid date';
    }
    
    // Format the date using date-fns with the specified locale
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return 'Invalid date';
  }
}

/**
 * Formats a number as currency
 * 
 * @param amount Number to format as currency
 * @param currency Currency code (defaults to 'USD')
 * @param locale Locale to use for formatting (defaults to 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}
