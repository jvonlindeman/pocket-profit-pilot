
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

/**
 * Converts a date to Panama timezone
 */
export function toPanamaTime(date: Date): Date {
  return convertToPanamaTimezone(date);
}

/**
 * Format date in Panama timezone with specific format
 */
export function formatInPanamaTimezone(date: Date, formatPattern: string): string {
  const panamaDate = convertToPanamaTimezone(date);
  // Using a simple format for now - in a real app would use date-fns format
  return panamaDate.toLocaleDateString('en-US', { timeZone: PANAMA_TIMEZONE });
}

/**
 * Format date for Panama display with locale settings
 */
export function formatDateForPanamaDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: PANAMA_TIMEZONE
  });
}

/**
 * Parse a string to a date in Panama timezone
 */
export function parseToPanamaTime(dateString: string): Date {
  const date = new Date(dateString);
  return convertToPanamaTimezone(date);
}
