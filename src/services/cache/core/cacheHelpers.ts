
import { CacheSource } from "../types";

/**
 * Helper functions for cache operations
 */
export class CacheHelpers {
  /**
   * Generate cache key for logging and tracking
   */
  static generateCacheKey(source: CacheSource, startDate: Date, endDate: Date): string {
    return `${source}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
  }

  /**
   * Format date range for logging
   */
  static formatDateRange(startDate: Date, endDate: Date): string {
    return `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
  }

  /**
   * Log cache operation with consistent formatting
   */
  static logCacheOperation(operation: string, source: CacheSource, startDate: Date, endDate: Date, details?: any): void {
    const dateRange = this.formatDateRange(startDate, endDate);
    console.log(`${operation} CacheService: ${source}`, {
      dateRange,
      ...details
    });
  }

  /**
   * Check if date range represents exactly one month
   */
  static isExactMonthRange(startDate: Date, endDate: Date): boolean {
    const startInfo = { year: startDate.getFullYear(), month: startDate.getMonth() + 1 };
    const endInfo = { year: endDate.getFullYear(), month: endDate.getMonth() + 1 };
    
    return (
      startInfo.year === endInfo.year &&
      startInfo.month === endInfo.month &&
      startDate.getDate() === 1 &&
      endDate.getDate() === new Date(endInfo.year, endInfo.month, 0).getDate()
    );
  }

  /**
   * Extract year and month from date
   */
  static getYearAndMonth(date: Date): { year: number; month: number } {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1 // JavaScript months are 0-indexed
    };
  }

  /**
   * Filter transactions to find collaborator transactions
   */
  static filterCollaboratorTransactions(transactions: any[]): any[] {
    return transactions.filter(tx => 
      tx.category === 'Pagos a colaboradores' || 
      tx.description?.toLowerCase().includes('colaborador')
    );
  }
}
