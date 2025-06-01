
import type { CacheSource, CacheClearOptions } from "../types";

/**
 * Validation utilities for cache operations
 */
export class CacheValidation {
  /**
   * Validate date range parameters
   */
  static validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
    if (!startDate || !endDate) {
      return { isValid: false, error: "Start date and end date are required" };
    }

    if (startDate > endDate) {
      return { isValid: false, error: "Start date cannot be after end date" };
    }

    return { isValid: true };
  }

  /**
   * Validate cache source
   */
  static validateCacheSource(source: CacheSource): { isValid: boolean; error?: string } {
    const validSources: CacheSource[] = ['Zoho', 'Stripe'];
    
    if (!validSources.includes(source)) {
      return { isValid: false, error: `Invalid cache source: ${source}` };
    }

    return { isValid: true };
  }

  /**
   * Validate cache clear options
   */
  static validateClearOptions(options?: CacheClearOptions): { isValid: boolean; error?: string } {
    if (!options) {
      return { isValid: true };
    }

    if (options.source && options.source !== 'all') {
      const sourceValidation = this.validateCacheSource(options.source as CacheSource);
      if (!sourceValidation.isValid) {
        return sourceValidation;
      }
    }

    if (options.startDate && options.endDate) {
      return this.validateDateRange(options.startDate, options.endDate);
    }

    return { isValid: true };
  }

  /**
   * Validate transactions array
   */
  static validateTransactions(transactions: any[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(transactions)) {
      return { isValid: false, error: "Transactions must be an array" };
    }

    if (transactions.length === 0) {
      return { isValid: false, error: "Transactions array cannot be empty" };
    }

    return { isValid: true };
  }
}
