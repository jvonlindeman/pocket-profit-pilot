
// Utility functions for date formatting and manipulation
import { 
  formatDateYYYYMMDD_Panama, 
  toPanamaTime, 
  PANAMA_TIMEZONE, 
  formatInPanamaTimezone,
  parseToPanamaTime
} from './timezoneUtils';

/**
 * Format date in YYYY-MM-DD format without timezone shifts
 * Enhanced to use Panama timezone
 */
export const formatDateYYYYMMDD = (date: Date | string): string => {
  // If we're passed a string, try to convert it to a Date first
  if (typeof date === 'string') {
    try {
      // Handle YYYY-MM-DD format directly to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Use Panama timezone to ensure consistency
        return formatDateYYYYMMDD_Panama(date);
      }
      
      const parsedDate = parseToPanamaTime(date);
      if (!isNaN(parsedDate.getTime())) {
        // Valid date object created from string, now format it in Panama timezone
        return formatDateYYYYMMDD_Panama(parsedDate);
      }
      
      console.error(`Invalid date string: ${date}`);
      const today = new Date();
      return formatDateYYYYMMDD_Panama(today);
    } catch (error) {
      console.error(`Error processing date string: ${date}`, error);
      const today = new Date();
      return formatDateYYYYMMDD_Panama(today);
    }
  }
  
  try {
    // Normal case: input is already a Date object
    if (isNaN(date.getTime())) {
      console.error(`Invalid date object provided`);
      const today = new Date();
      return formatDateYYYYMMDD_Panama(today);
    }
    
    return formatDateYYYYMMDD_Panama(date);
  } catch (error) {
    console.error(`Error formatting date:`, error);
    const today = new Date();
    return formatDateYYYYMMDD_Panama(today);
  }
};

/**
 * Get the current month range (first day to last day) in Panama timezone
 */
export const getCurrentMonthRange = (): { startDate: Date; endDate: Date } => {
  const today = new Date();
  const panamaNow = toPanamaTime(today);
  
  // Get year and month in Panama timezone
  const year = parseInt(formatInPanamaTimezone(panamaNow, 'yyyy'));
  const month = parseInt(formatInPanamaTimezone(panamaNow, 'M')) - 1; // 0-indexed
  
  // First day of month in Panama timezone
  const firstDay = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  
  // Last day of month in Panama timezone (set to next month, day 0)
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));
  
  return {
    startDate: firstDay,
    endDate: lastDay
  };
};

/**
 * Log exact date information for debugging with timezone awareness
 */
export const logDateInfo = (label: string, dateRange: { startDate: Date; endDate: Date }) => {
  console.log(`${label}:`, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    startDateFormatted: formatDateYYYYMMDD(dateRange.startDate),
    endDateFormatted: formatDateYYYYMMDD(dateRange.endDate),
    startDatePanama: formatInPanamaTimezone(dateRange.startDate, 'yyyy-MM-dd HH:mm:ss'),
    endDatePanama: formatInPanamaTimezone(dateRange.endDate, 'yyyy-MM-dd HH:mm:ss'),
    timezone: PANAMA_TIMEZONE
  });
};

/**
 * Parse a date string safely and return a valid Date object in Panama timezone
 */
export const safeParseDateString = (dateString: string): Date => {
  return parseToPanamaTime(dateString);
};

/**
 * Format a date for display in the UI with Panama timezone
 */
export const formatDateForDisplay = (dateInput: Date | string): string => {
  try {
    const date = typeof dateInput === 'string' ? safeParseDateString(dateInput) : toPanamaTime(dateInput);
    return new Intl.DateTimeFormat('es-PA', {
      timeZone: PANAMA_TIMEZONE
    }).format(date);
  } catch (error) {
    console.error(`Error formatting date for display: ${dateInput}`, error);
    return 'Invalid date';
  }
};
