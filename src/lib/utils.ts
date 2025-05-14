
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseToPanamaTime, formatDateForPanamaDisplay } from "@/utils/timezoneUtils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safe date parser with fallback - ensures date strings are properly parsed
 * regardless of format, with detailed error handling
 * Now uses Panama timezone for consistency
 */
export function parseDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  try {
    // Use our Panama timezone parser
    return parseToPanamaTime(dateString);
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return new Date(); // Fallback to current date
  }
}

/**
 * Format a date consistently throughout the app
 * Now uses Panama timezone
 */
export function formatDisplayDate(date: Date | string): string {
  try {
    return formatDateForPanamaDisplay(date);
  } catch (error) {
    console.error(`Error formatting date: ${date}`, error);
    return 'Invalid date';
  }
}
