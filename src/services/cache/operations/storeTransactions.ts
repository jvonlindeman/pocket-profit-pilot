
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
 * Store transactions in cache
 */
export const storeTransactions = async (
  source: CacheSource,
  startDate: Date,
  endDate: Date,
  transactions: Transaction[]
): Promise<boolean> => {
  try {
    // Format dates for API
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    // Extract year and month
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    // For most cases, we're storing exactly one month's worth of data
    if (
      startDate.getDate() === 1 && 
      endDate.getTime() >= endOfMonth(startDate).getTime()
    ) {
      // Filter transactions to ensure they belong to this month
      const currentMonthStart = startOfMonth(startDate);
      const currentMonthEnd = endOfMonth(startDate);
      
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= currentMonthStart && txDate <= currentMonthEnd;
      });
      
      if (monthTransactions.length > 0) {
        // Store transactions for this month
        const success = await cacheStorage.storeMonthTransactions(
          source, 
          year, 
          month, 
          monthTransactions
        );
        
        // Record a successful cache update
        if (success) {
          await cacheMetrics.recordCacheUpdate(
            source, 
            formattedStartDate,
            formattedEndDate,
            monthTransactions.length
          );
        }
        
        return success;
      }
      
      return true;
    } 
    else {
      // Complex case - processing a date range that doesn't match exactly one month
      // Store transactions in monthly buckets
      const monthMap = new Map<string, Transaction[]>();
      
      transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;
        
        if (!monthMap.has(key)) {
          monthMap.set(key, []);
        }
        
        monthMap.get(key)!.push(tx);
      });
      
      // Store each month's transactions separately
      const results: boolean[] = [];
      for (const [key, txs] of monthMap.entries()) {
        const [yearStr, monthStr] = key.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        
        const success = await cacheStorage.storeMonthTransactions(
          source,
          year,
          month,
          txs
        );
        
        results.push(success);
        
        if (success) {
          // Calculate the month's date range for metrics
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = endOfMonth(monthStart);
          
          await cacheMetrics.recordCacheUpdate(
            source,
            formatDate(monthStart),
            formatDate(monthEnd),
            txs.length
          );
        }
      }
      
      return results.every(result => result);
    }
  } catch (err) {
    console.error("Exception storing transactions in cache:", err);
    return false;
  }
};
