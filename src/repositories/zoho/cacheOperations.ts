
import { Transaction } from "../../types/financial";
import { formatDateYYYYMMDD } from "../../utils/dateUtils";
import CacheService from "../../services/cache";
import { cacheStorage } from "../../services/cache/storage";
import { apiRequestManager } from "../../utils/ApiRequestManager";

/**
 * Handles all cache-related operations for Zoho data
 */
export class ZohoCacheOperations {
  /**
   * Check if data is available in cache for the given date range
   */
  async checkCacheAvailability(startDate: Date, endDate: Date): Promise<{
    cached: boolean;
    partial: boolean;
    transactions?: Transaction[];
  }> {
    console.log(`📦 ZohoCacheOperations: Checking cache for ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    const cacheResult = await CacheService.checkCache('Zoho', startDate, endDate);
    
    if (cacheResult.cached && !cacheResult.partial) {
      console.log(`✅ ZohoCacheOperations: Cache HIT - Loading from cache without webhook call`);
      
      // Use the cache storage to get transactions directly
      const startDateStr = formatDateYYYYMMDD(startDate);
      const endDateStr = formatDateYYYYMMDD(endDate);
      const cachedTransactions = await cacheStorage.getTransactions('Zoho', startDateStr, endDateStr);
      
      if (cachedTransactions && cachedTransactions.length > 0) {
        console.log(`📋 ZohoCacheOperations: Successfully loaded ${cachedTransactions.length} transactions from cache`);
        return {
          cached: true,
          partial: false,
          transactions: cachedTransactions
        };
      }
    }
    
    console.log(`❌ ZohoCacheOperations: Cache MISS or partial cache - Will need to call webhook`);
    return {
      cached: false,
      partial: cacheResult.partial || false
    };
  }

  /**
   * Store transactions in cache
   */
  async storeTransactions(startDate: Date, endDate: Date, transactions: Transaction[]): Promise<void> {
    if (transactions.length > 0) {
      console.log(`💾 ZohoCacheOperations: Storing ${transactions.length} transactions in cache`);
      try {
        await CacheService.storeTransactions('Zoho', startDate, endDate, transactions);
      } catch (cacheError) {
        console.error("⚠️ ZohoCacheOperations: Failed to store transactions in cache:", cacheError);
        // Continue without failing the request
      }
    }
  }

  /**
   * Clear cache for the given date range
   */
  async clearCache(startDate: Date, endDate: Date): Promise<void> {
    console.log(`🔄 ZohoCacheOperations: Clearing cache for ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    await CacheService.clearCache({
      source: 'Zoho',
      startDate,
      endDate
    });
    
    const cacheKey = `zoho-transactions-${formatDateYYYYMMDD(startDate)}-${formatDateYYYYMMDD(endDate)}`;
    apiRequestManager.clearCacheEntry(cacheKey);
  }
}
