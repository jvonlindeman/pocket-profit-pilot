import { toZonedTime, fromZonedTime, format as formatTZ } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';

// Define Panama timezone
export const PANAMA_TIMEZONE = 'America/Panama';

/**
 * Convert a date to Panama timezone
 */
export const toPanamaTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, PANAMA_TIMEZONE);
};

/**
 * Convert a Panama timezone date to UTC
 */
export const fromPanamaTime = (date: Date): Date => {
  return fromZonedTime(date, PANAMA_TIMEZONE);
};

/**
 * Format a date in Panama timezone with the specified format
 */
export const formatInPanamaTimezone = (
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatTZ(dateObj, formatStr, { timeZone: PANAMA_TIMEZONE });
};

/**
 * Parse an ISO date string and convert to Panama timezone
 */
export const parseToPanamaTime = (dateString: string): Date => {
  try {
    if (!dateString) {
      console.warn('Empty date string provided to parseToPanamaTime');
      return toPanamaTime(new Date());
    }
    
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Parse date in Panama timezone
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return toPanamaTime(date);
    }
    
    // For ISO strings
    if (dateString.includes('T')) {
      return toPanamaTime(parseISO(dateString));
    }
    
    // Fallback
    return toPanamaTime(new Date(dateString));
  } catch (error) {
    console.error(`Error parsing date to Panama time: ${dateString}`, error);
    return toPanamaTime(new Date());
  }
};

/**
 * Format a date for display using es-PA locale and Panama timezone
 */
export const formatDateForPanamaDisplay = (date: Date | string): string => {
  const panamaDate = typeof date === 'string' ? parseToPanamaTime(date) : toPanamaTime(date);
  return new Intl.DateTimeFormat('es-PA', {
    timeZone: PANAMA_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(panamaDate);
};

/**
 * Format date in YYYY-MM-DD format in Panama timezone without timezone shifts
 */
export const formatDateYYYYMMDD_Panama = (date: Date | string): string => {
  const panamaDate = typeof date === 'string' ? parseToPanamaTime(date) : toPanamaTime(date);
  return formatInPanamaTimezone(panamaDate, 'yyyy-MM-dd');
};

/**
 * Debug function to log timezone information
 */
export const logTimezoneInfo = (label: string, date: Date | string): void => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  console.log(`[${label}] Timezone Debug:`, {
    inputDate: dateObj.toString(),
    inputISO: dateObj.toISOString(),
    localTimezone: localTZ,
    localFormatted: format(dateObj, 'yyyy-MM-dd HH:mm:ss'),
    panamaTZ: PANAMA_TIMEZONE,
    panamaTime: formatInPanamaTimezone(dateObj, 'yyyy-MM-dd HH:mm:ss'),
    panamaDate: toPanamaTime(dateObj).toString(),
  });
};
