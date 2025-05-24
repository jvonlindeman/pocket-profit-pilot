
import { Transaction } from "../../../types/financial";
import { cacheStorage } from "../storage";
import { cacheMetrics } from "../metrics";
import { CacheSource } from "../types";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * Format a date for API use
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Store transactions in cache with improved error handling and validation
 */
export const storeTransactions = async (
  source: CacheSource,
  startDate: Date,
  endDate: Date,
  transactions: Transaction[]
): Promise<boolean> => {
  console.log(`[CACHE_STORAGE_DEBUG] Starting storeTransactions for ${source}`, {
    source,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    transactionCount: transactions.length
  });

  try {
    // Validate input parameters
    if (!source || !startDate || !endDate || !Array.isArray(transactions)) {
      console.error("[CACHE_STORAGE_DEBUG] Invalid input parameters:", {
        source: !!source,
        startDate: !!startDate,
        endDate: !!endDate,
        transactionsIsArray: Array.isArray(transactions)
      });
      return false;
    }

    if (transactions.length === 0) {
      console.warn("[CACHE_STORAGE_DEBUG] No transactions to store");
      return true; // Not an error, just nothing to store
    }

    // Validate transaction data structure
    const validTransactions = transactions.filter((tx, index) => {
      const isValid = !!(
        tx.id && 
        tx.amount !== undefined && 
        tx.date && 
        tx.type && 
        tx.source
      );
      
      if (!isValid) {
        console.error(`[CACHE_STORAGE_DEBUG] Invalid transaction at index ${index}:`, {
          hasId: !!tx.id,
          hasAmount: tx.amount !== undefined,
          hasDate: !!tx.date,
          hasType: !!tx.type,
          hasSource: !!tx.source,
          transaction: tx
        });
      }
      
      return isValid;
    });

    console.log(`[CACHE_STORAGE_DEBUG] Validated ${validTransactions.length} out of ${transactions.length} transactions`);

    if (validTransactions.length === 0) {
      console.error("[CACHE_STORAGE_DEBUG] No valid transactions to store after validation");
      return false;
    }

    // Format dates for API
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    // Extract year and month
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    console.log(`[CACHE_STORAGE_DEBUG] Processing date range: ${formattedStartDate} to ${formattedEndDate} (${year}/${month})`);
    
    // For most cases, we're storing exactly one month's worth of data
    if (
      startDate.getDate() === 1 && 
      endDate.getTime() >= endOfMonth(startDate).getTime()
    ) {
      console.log("[CACHE_STORAGE_DEBUG] Detected full month storage pattern");
      
      // Filter transactions to ensure they belong to this month
      const currentMonthStart = startOfMonth(startDate);
      const currentMonthEnd = endOfMonth(startDate);
      
      const monthTransactions = validTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        const belongsToMonth = txDate >= currentMonthStart && txDate <= currentMonthEnd;
        
        if (!belongsToMonth) {
          console.log(`[CACHE_STORAGE_DEBUG] Transaction ${tx.id} date ${tx.date} outside month range`);
        }
        
        return belongsToMonth;
      });
      
      console.log(`[CACHE_STORAGE_DEBUG] Filtered to ${monthTransactions.length} transactions for month ${year}/${month}`);
      
      if (monthTransactions.length > 0) {
        // Store transactions for this month using the monthly storage method
        console.log(`[CACHE_STORAGE_DEBUG] Storing ${monthTransactions.length} transactions for month ${year}/${month}`);
        
        const success = await cacheStorage.storeMonthTransactions(
          source, 
          year, 
          month, 
          monthTransactions
        );
        
        console.log(`[CACHE_STORAGE_DEBUG] Monthly storage result: ${success}`);
        
        // Record a successful cache update
        if (success) {
          try {
            await cacheMetrics.recordCacheUpdate(
              source, 
              formattedStartDate,
              formattedEndDate,
              monthTransactions.length
            );
            console.log("[CACHE_STORAGE_DEBUG] Cache metrics recorded successfully");
          } catch (metricsErr) {
            console.error("[CACHE_STORAGE_DEBUG] Failed to record cache metrics:", metricsErr);
            // Don't fail the entire operation for metrics failure
          }
        } else {
          console.error("[CACHE_STORAGE_DEBUG] Monthly storage failed");
        }
        
        return success;
      } else {
        console.warn("[CACHE_STORAGE_DEBUG] No transactions in date range after filtering");
        return true; // Not an error if no transactions in range
      }
    } 
    else {
      console.log("[CACHE_STORAGE_DEBUG] Complex date range - processing by monthly buckets");
      
      // Complex case - processing a date range that doesn't match exactly one month
      // Store transactions in monthly buckets
      const monthMap = new Map<string, Transaction[]>();
      
      validTransactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
        
        if (!monthMap.has(key)) {
          monthMap.set(key, []);
        }
        
        monthMap.get(key)!.push(tx);
      });
      
      console.log(`[CACHE_STORAGE_DEBUG] Grouped transactions into ${monthMap.size} monthly buckets:`, 
        Array.from(monthMap.entries()).map(([key, txs]) => `${key}: ${txs.length} transactions`)
      );
      
      // Store each month's transactions separately
      const results: boolean[] = [];
      for (const [key, txs] of monthMap.entries()) {
        const [yearStr, monthStr] = key.split('-');
        const bucketYear = parseInt(yearStr);
        const bucketMonth = parseInt(monthStr);
        
        console.log(`[CACHE_STORAGE_DEBUG] Storing bucket ${key} with ${txs.length} transactions`);
        
        const success = await cacheStorage.storeMonthTransactions(
          source,
          bucketYear,
          bucketMonth,
          txs
        );
        
        console.log(`[CACHE_STORAGE_DEBUG] Bucket ${key} storage result: ${success}`);
        results.push(success);
        
        if (success) {
          // Calculate the month's date range for metrics
          const monthStart = new Date(bucketYear, bucketMonth - 1, 1);
          const monthEnd = endOfMonth(monthStart);
          
          try {
            await cacheMetrics.recordCacheUpdate(
              source,
              formatDate(monthStart),
              formatDate(monthEnd),
              txs.length
            );
          } catch (metricsErr) {
            console.error(`[CACHE_STORAGE_DEBUG] Failed to record metrics for bucket ${key}:`, metricsErr);
          }
        }
      }
      
      const allSuccessful = results.every(result => result);
      console.log(`[CACHE_STORAGE_DEBUG] All buckets stored successfully: ${allSuccessful}`);
      
      return allSuccessful;
    }
  } catch (err) {
    console.error("[CACHE_STORAGE_DEBUG] Exception storing transactions in cache:", err);
    return false;
  }
};
