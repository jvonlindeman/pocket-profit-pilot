
// Utility functions for date formatting and manipulation

/**
 * Format date in YYYY-MM-DD format without timezone shifts
 * Enhanced to be more robust against invalid date inputs
 */
export const formatDateYYYYMMDD = (date: Date | string): string => {
  // If we're passed a string, try to convert it to a Date first
  if (typeof date === 'string') {
    try {
      // Handle YYYY-MM-DD format directly to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date; // Already in the right format
      }
      
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        // Valid date object created from string, now format it
        return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
      }
      
      console.error(`Invalid date string: ${date}`);
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    } catch (error) {
      console.error(`Error processing date string: ${date}`, error);
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
  }
  
  try {
    // Normal case: input is already a Date object
    if (isNaN(date.getTime())) {
      console.error(`Invalid date object provided`);
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (error) {
    console.error(`Error formatting date:`, error);
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
};

/**
 * Get the current month range (first day to last day)
 */
export const getCurrentMonthRange = (): { startDate: Date; endDate: Date } => {
  const today = new Date();
  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1), // First day of current month
    endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0) // Last day of current month
  };
};

/**
 * Log exact date information for debugging
 */
export const logDateInfo = (label: string, dateRange: { startDate: Date; endDate: Date }) => {
  console.log(`${label}:`, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    startDateFormatted: formatDateYYYYMMDD(dateRange.startDate),
    endDateFormatted: formatDateYYYYMMDD(dateRange.endDate)
  });
};

/**
 * Parse a date string safely and return a valid Date object
 * This function handles various date formats and provides a fallback
 */
export const safeParseDateString = (dateString: string): Date => {
  try {
    // Handle YYYY-MM-DD format (common in API responses)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try standard Date parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    console.warn(`Could not parse date string: ${dateString}, using current date as fallback`);
    return new Date();
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return new Date();
  }
};

/**
 * Format a date for display in the UI with consistent localization
 */
export const formatDateForDisplay = (dateInput: Date | string): string => {
  try {
    const date = typeof dateInput === 'string' ? safeParseDateString(dateInput) : dateInput;
    return new Intl.DateTimeFormat('es-ES').format(date);
  } catch (error) {
    console.error(`Error formatting date for display: ${dateInput}`, error);
    return 'Invalid date';
  }
};
