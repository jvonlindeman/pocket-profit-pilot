
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
 * Added safety checks to prevent "Invalid time value" errors
 */
export const formatDateForPanamaDisplay = (date: Date | string | undefined | null): string => {
  try {
    // Safety check for undefined or null dates
    if (date === undefined || date === null) {
      console.warn('Undefined or null date provided to formatDateForPanamaDisplay');
      return 'Invalid date';
    }

    // For string dates, parse safely
    if (typeof date === 'string') {
      try {
        if (!date.trim()) return 'Invalid date';
        const parsed = parseToPanamaTime(date);
        
        // Verify the parsed date is valid
        if (isNaN(parsed.getTime())) {
          console.warn('Invalid date string parsed:', date);
          return 'Invalid date';
        }
        
        return new Intl.DateTimeFormat('es-PA', {
          timeZone: PANAMA_TIMEZONE,
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(parsed);
      } catch (e) {
        console.error('Error parsing date string:', date, e);
        return 'Invalid date';
      }
    }
    
    // For Date objects, verify they're valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid Date object provided to formatDateForPanamaDisplay');
      return 'Invalid date';
    }
    
    const panamaDate = toPanamaTime(date);
    return new Intl.DateTimeFormat('es-PA', {
      timeZone: PANAMA_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(panamaDate);
  } catch (error) {
    console.error(`Error in formatDateForPanamaDisplay:`, error);
    return 'Invalid date';
  }
};

/**
 * Format date in YYYY-MM-DD format in Panama timezone without timezone shifts
 */
export const formatDateYYYYMMDD_Panama = (date: Date | string | undefined | null): string => {
  try {
    // Safety check for undefined or null dates
    if (date === undefined || date === null) {
      console.warn('Undefined or null date provided to formatDateYYYYMMDD_Panama');
      return '';
    }
    
    const panamaDate = typeof date === 'string' ? parseToPanamaTime(date) : toPanamaTime(date);
    
    // Verify the date is valid
    if (isNaN(panamaDate.getTime())) {
      console.warn('Invalid date in formatDateYYYYMMDD_Panama');
      return '';
    }
    
    return formatInPanamaTimezone(panamaDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error(`Error in formatDateYYYYMMDD_Panama:`, error);
    return '';
  }
};

/**
 * Debug function to log timezone information
 */
export const logTimezoneInfo = (label: string, date: Date | string): void => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verify the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn(`[${label}] Invalid date provided to logTimezoneInfo`);
      return;
    }
    
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
  } catch (error) {
    console.error(`Error in logTimezoneInfo:`, error);
  }
};
