
import { supabase } from "../../../integrations/supabase/client";
import { CacheSource } from "../types";

/**
 * Base class for database operations
 * Provides common utility methods for database interactions
 */
export class CacheDbClient {
  /**
   * Get the Supabase client instance
   */
  protected getClient() {
    return supabase;
  }

  /**
   * Format a date to ISO string (date only)
   */
  protected formatDate(date: string | Date): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date.split('T')[0];
  }

  /**
   * Log database errors with context
   */
  protected logError(context: string, error: any): void {
    console.error(`Error in ${context}:`, error);
  }
}

export const cacheDbClient = new CacheDbClient();
