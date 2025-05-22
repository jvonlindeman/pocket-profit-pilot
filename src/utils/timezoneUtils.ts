
// Panama timezone constant
export const PANAMA_TIMEZONE = 'America/Panama';

/**
 * Format a date to YYYY-MM-DD in Panama timezone
 */
export function formatDateYYYYMMDD_Panama(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    timeZone: PANAMA_TIMEZONE
  };
  
  // Format in Panama timezone
  const dateFormatter = new Intl.DateTimeFormat('fr-CA', options);
  return dateFormatter.format(date); // Returns YYYY-MM-DD format
}

/**
 * Convert a date to Panama timezone
 */
export function convertToPanamaTimezone(date: Date): Date {
  // Create a date string using Panama timezone
  const panamaDateStr = date.toLocaleString('en-US', { timeZone: PANAMA_TIMEZONE });
  // Parse that string back to a date
  return new Date(panamaDateStr);
}

/**
 * Get start of day in Panama timezone
 */
export function startOfDayPanama(date: Date): Date {
  const panamaDate = convertToPanamaTimezone(date);
  panamaDate.setHours(0, 0, 0, 0);
  return panamaDate;
}

/**
 * Get end of day in Panama timezone
 */
export function endOfDayPanama(date: Date): Date {
  const panamaDate = convertToPanamaTimezone(date);
  panamaDate.setHours(23, 59, 59, 999);
  return panamaDate;
}
