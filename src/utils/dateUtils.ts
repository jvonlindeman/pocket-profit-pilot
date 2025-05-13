
// Utility functions for date formatting and manipulation

/**
 * Format date in YYYY-MM-DD format without timezone shifts
 */
export const formatDateYYYYMMDD = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Get the current month range (first day to last day)
 */
export const getCurrentMonthRange = (): { startDate: Date; endDate: Date } => {
  const today = new Date();
  return {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
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
