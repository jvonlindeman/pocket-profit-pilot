
import { Transaction } from "../../../types/financial";
import { CacheSource } from "../types";
import { enhancedTransactionStorage } from "./enhancedStoreTransactions";
import { cacheStalenessManager } from "../staleness";
import { dataIntegrityValidator } from "../validation/dataIntegrity";

/**
 * Atomic cache refresh operations
 */
export class AtomicCacheRefresh {
  /**
   * Perform atomic cache refresh: clear → fetch → store
   */
  static async refreshCache(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    fetchFunction: () => Promise<Transaction[]>
  ): Promise<{ success: boolean; transactionCount: number; errors: string[] }> {
    
    console.log(`[ATOMIC_REFRESH] Starting atomic refresh for ${source}`, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    try {
      // Step 1: Clear existing cache (physical deletion)
      console.log(`[ATOMIC_REFRESH] Step 1: Clearing existing cache`);
      await cacheStalenessManager.markCacheStale(source, startDate, endDate);

      // Step 2: Fetch fresh data from API
      console.log(`[ATOMIC_REFRESH] Step 2: Fetching fresh data from API`);
      const freshTransactions = await fetchFunction();

      if (!freshTransactions || freshTransactions.length === 0) {
        console.warn(`[ATOMIC_REFRESH] No fresh data fetched from API for ${source}`);
        return {
          success: true,
          transactionCount: 0,
          errors: []
        };
      }

      console.log(`[ATOMIC_REFRESH] Fetched ${freshTransactions.length} fresh transactions from API`);

      // Step 3: Validate fresh data
      const validation = dataIntegrityValidator.validateTransactionBatch(freshTransactions);
      
      if (validation.invalid.length > 0) {
        console.warn(`[ATOMIC_REFRESH] Found ${validation.invalid.length} invalid transactions in fresh data`);
      }

      if (validation.valid.length === 0) {
        console.error(`[ATOMIC_REFRESH] No valid transactions in fresh data`);
        return {
          success: false,
          transactionCount: 0,
          errors: ['No valid transactions in fresh API data']
        };
      }

      // Step 4: Store fresh data in cache
      console.log(`[ATOMIC_REFRESH] Step 3: Storing ${validation.valid.length} valid transactions in cache`);
      const storageResult = await enhancedTransactionStorage.storeTransactions(
        source,
        startDate,
        endDate,
        validation.valid
      );

      if (!storageResult.success) {
        console.error(`[ATOMIC_REFRESH] Failed to store fresh data in cache:`, storageResult.errors);
        return {
          success: false,
          transactionCount: 0,
          errors: storageResult.errors
        };
      }

      // Step 5: Clear staleness markers (cache is now fresh)
      console.log(`[ATOMIC_REFRESH] Step 4: Clearing staleness markers`);
      cacheStalenessManager.clearStaleness(source, startDate, endDate);

      console.log(`[ATOMIC_REFRESH] Atomic refresh completed successfully`, {
        source,
        storedCount: storageResult.storedCount,
        errors: storageResult.errors.length
      });

      return {
        success: true,
        transactionCount: storageResult.storedCount,
        errors: storageResult.errors
      };

    } catch (error) {
      console.error(`[ATOMIC_REFRESH] Exception during atomic refresh:`, error);
      return {
        success: false,
        transactionCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown refresh error']
      };
    }
  }

  /**
   * Validate refresh completeness by comparing with existing cache
   */
  static async validateRefreshCompleteness(
    source: CacheSource,
    originalData: Transaction[],
    refreshedData: Transaction[]
  ): Promise<{ isComplete: boolean; report: string }> {
    
    console.log(`[ATOMIC_REFRESH] Validating refresh completeness for ${source}`);
    
    const comparison = dataIntegrityValidator.compareDataCompleteness(
      refreshedData,
      originalData,
      source
    );

    const isComplete = comparison.isComplete || refreshedData.length >= originalData.length;
    
    const report = `Refresh Completeness Report for ${source}:
- Original Count: ${originalData.length}
- Refreshed Count: ${refreshedData.length}
- Data Complete: ${isComplete}
- ${comparison.report}`;

    console.log(report);

    return {
      isComplete,
      report
    };
  }
}

export const atomicCacheRefresh = new AtomicCacheRefresh();
