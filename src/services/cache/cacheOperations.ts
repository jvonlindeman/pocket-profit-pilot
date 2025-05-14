
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "../../types/financial";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";
import { CacheResponse } from "./cacheTypes";

// Store last cache check result
let lastCacheCheckResult: CacheResponse | null = null;

/**
 * Core cache operations for checking and storing transaction data
 */
export const cacheOperations = {
  /**
   * Check if data for a date range is in cache
   */
  checkCache: async (
    source: string,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse> => {
    try {
      console.log(`CacheOperations: Checking cache for ${source} data from ${startDate} to ${endDate}`);
      
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // Call cache-manager edge function
      const { data, error } = await supabase.functions.invoke('cache-manager', {
        body: {
          source,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          forceRefresh
        }
      });
      
      if (error) {
        console.error("CacheOperations: Error checking cache:", error);
        throw new Error(`Cache check failed: ${error.message}`);
      }
      
      console.log(`CacheOperations: Cache check result:`, data);
      
      // Store last cache check result
      lastCacheCheckResult = data as CacheResponse;
      
      return data as CacheResponse;
    } catch (err) {
      console.error("CacheOperations: Error in checkCache", err);
      return { 
        cached: false, 
        status: "error",
        metrics: {
          source,
          startDate: formatDateYYYYMMDD(startDate),
          endDate: formatDateYYYYMMDD(endDate),
          cacheHit: false
        }
      };
    }
  },
  
  /**
   * Store transactions in cache
   */
  storeTransactions: async (
    source: string,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<boolean> => {
    try {
      console.log(`CacheOperations: Storing ${transactions.length} ${source} transactions from ${startDate} to ${endDate}`);
      
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // First, create a cache segment
      const { error: segmentError } = await supabase
        .from('cache_segments')
        .upsert({
          source,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          transaction_count: transactions.length,
          last_refreshed_at: new Date().toISOString(),
          status: 'complete'
        }, { onConflict: 'source, start_date, end_date' });
      
      if (segmentError) {
        console.error("CacheOperations: Error creating cache segment:", segmentError);
        throw new Error(`Segment creation failed: ${segmentError.message}`);
      }
      
      // Format transactions for cache storage
      const cacheTransactions = transactions.map(tx => ({
        external_id: tx.id,
        date: tx.date,
        amount: tx.amount,
        description: tx.description || null,
        category: tx.category || null,
        source: tx.source,
        type: tx.type,
        fees: tx.fees || null,
        gross: tx.gross || null,
        metadata: tx.metadata || {},
        fetched_at: new Date().toISOString()
      }));
      
      // Upsert the transactions (use external_id for conflict resolution)
      for (let i = 0; i < cacheTransactions.length; i += 100) {
        const batch = cacheTransactions.slice(i, i + 100);
        const { error: txError } = await supabase
          .from('cached_transactions')
          .upsert(batch, { onConflict: 'external_id' });
        
        if (txError) {
          console.error("CacheOperations: Error storing transactions:", txError);
          throw new Error(`Transaction storage failed: ${txError.message}`);
        }
      }
      
      console.log(`CacheOperations: Successfully cached ${transactions.length} transactions`);
      return true;
    } catch (err) {
      console.error("CacheOperations: Error in storeTransactions", err);
      return false;
    }
  },
  
  /**
   * Get the last cache check result (useful for debugging)
   */
  getLastCacheCheckResult: (): CacheResponse | null => {
    return lastCacheCheckResult;
  }
};
