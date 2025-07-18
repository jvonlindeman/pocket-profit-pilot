
import { CacheSource, CacheClearOptions, DetailedCacheStats } from "./types";
import { Transaction } from "../../types/financial";
import { segmentRepository } from "./db/segments";
import { transactionRepository } from "./db/transactions";
import { statsRepository } from "./db/stats";
import { monthlyRepository } from "./db/monthly";
import { supabase } from "../../integrations/supabase/client";

/**
 * CacheStorage handles all database interactions for the cache system
 * This is a facade that delegates to specialized repositories
 */
export class CacheStorage {
  /**
   * Check if a month is cached
   */
  async isMonthCached(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<boolean> {
    const result = await monthlyRepository.isMonthCached(source, year, month);
    return result.isCached;
  }

  /**
   * Get transactions for a specific month
   */
  async getMonthTransactions(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<Transaction[]> {
    return monthlyRepository.getMonthTransactions(source, year, month);
  }

  /**
   * Store transactions for a specific month
   */
  async storeMonthTransactions(
    source: CacheSource | string,
    year: number,
    month: number,
    transactions: Transaction[]
  ): Promise<boolean> {
    return monthlyRepository.storeMonthTransactions(source, year, month, transactions);
  }

  /**
   * Get information about a monthly cache entry
   */
  async getMonthCacheInfo(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<{ id: string; transaction_count: number } | null> {
    try {
      // Use the repository method instead of direct access to getClient()
      return monthlyRepository.getMonthCacheInfo(source, year, month);
    } catch (err) {
      console.error("Exception getting month cache info:", err);
      return null;
    }
  }

  /**
   * Clear monthly cache
   */
  async clearMonthlyCache(
    source?: CacheSource,
    year?: number,
    month?: number
  ): Promise<boolean> {
    return statsRepository.clearMonthlyCache(source, year, month);
  }

  /**
   * Check if a date range exists in cache using database function
   * Legacy method kept for backward compatibility
   */
  async checkDateRangeCached(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ) {
    return segmentRepository.checkDateRangeCached(source, startDate, endDate);
  }

  /**
   * Retrieve transactions from cache
   * Legacy method kept for backward compatibility
   */
  async getTransactions(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    return transactionRepository.getTransactions(source, startDate, endDate);
  }

  /**
   * Store transactions in cache
   * Legacy method kept for backward compatibility
   */
  async storeTransactions(
    source: CacheSource | string,
    startDate: string,
    endDate: string,
    transactions: Transaction[]
  ): Promise<{ success: boolean; segmentId?: string }> {
    try {
      // First, create a new cache segment
      const { success, segmentId } = await segmentRepository.createSegment(
        source, 
        startDate, 
        endDate, 
        transactions.length
      );
      
      if (!success || !segmentId) {
        console.error("Failed to create cache segment");
        return { success: false };
      }
      
      // Then store transactions
      const stored = await transactionRepository.storeTransactions(
        source, 
        startDate, 
        endDate, 
        transactions,
        segmentId
      );
      
      if (!stored) {
        // Update segment status to partial if transactions weren't stored successfully
        await segmentRepository.updateSegment(segmentId, 'partial');
        return { success: false };
      }
      
      return { success: true, segmentId };
    } catch (err) {
      console.error("Exception in storeTransactions:", err);
      return { success: false };
    }
  }

  /**
   * Get cache segment information
   * Legacy method kept for backward compatibility
   */
  async getCacheSegmentInfo(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ) {
    return segmentRepository.getCacheSegmentInfo(source, startDate, endDate);
  }

  /**
   * Get detailed cache statistics
   */
  async getDetailedStats(): Promise<DetailedCacheStats> {
    return statsRepository.getDetailedStats();
  }

  /**
   * Clear cache data
   */
  async clearCache(
    source?: CacheSource | 'all',
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      const sourceFilter = source && source !== 'all' ? source : undefined;
      
      // Clear segments
      const segmentsDeleted = await segmentRepository.deleteSegments(
        sourceFilter as CacheSource, 
        startDate, 
        endDate
      );
      
      if (!segmentsDeleted) {
        return false;
      }
      
      // Clear transactions
      const transactionsDeleted = await statsRepository.deleteTransactions(
        sourceFilter as CacheSource, 
        startDate, 
        endDate
      );
      
      if (!transactionsDeleted) {
        return false;
      }
      
      console.log(`Cache cleared for ${source || 'all'} sources ${startDate ? 'from ' + startDate + ' to ' + endDate : ''}`);
      return true;
    } catch (err) {
      console.error("Exception clearing cache:", err);
      return false;
    }
  }

  /**
   * Fix transactions with missing year/month values
   * Added to support the cache migration process
   */
  async fixLegacyTransactions(source?: CacheSource): Promise<number> {
    return monthlyRepository.fixLegacyTransactions(source);
  }
}

export const cacheStorage = new CacheStorage();
