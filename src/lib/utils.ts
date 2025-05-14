
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safe date parser with fallback - ensures date strings are properly parsed
 * regardless of format, with detailed error handling
 */
export function parseDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  try {
    // Handle potential YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Ensure we're parsing as UTC to avoid timezone shifts
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      
      // Validate if parsed correctly
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${dateString}, returning current date`);
        return new Date();
      }
      return date;
    }
    
    // Try standard Date parsing as fallback
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Failed to parse date: ${dateString}, returning current date`);
      return new Date();
    }
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return new Date(); // Fallback to current date
  }
}

/**
 * Format a date consistently throughout the app
 */
export function formatDisplayDate(date: Date | string): string {
  try {
    const parsedDate = parseDate(date);
    return new Intl.DateTimeFormat('es-ES').format(parsedDate);
  } catch (error) {
    console.error(`Error formatting date: ${date}`, error);
    return 'Invalid date';
  }
}

