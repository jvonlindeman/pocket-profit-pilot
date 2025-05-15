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
      
      if (transactions.length === 0) {
        console.warn("CacheOperations: No transactions to store, skipping cache update");
        return false;
      }
      
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // First, check if we already have some of these transactions to avoid duplicates
      const { count: existingCount, error: existingError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
      
      if (existingError) {
        console.error("CacheOperations: Error checking existing transactions:", existingError);
      } else if (existingCount && existingCount > 0) {
        console.log(`CacheOperations: Found ${existingCount} existing transactions for this period`);
      }
      
      // Create a cache segment with initial 'processing' status
      const { error: segmentError } = await supabase
        .from('cache_segments')
        .upsert({
          source,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          transaction_count: transactions.length,
          last_refreshed_at: new Date().toISOString(),
          status: 'processing' // Mark as processing until all transactions are stored
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
      
      // Upsert the transactions in smaller batches to ensure they all get stored
      let successCount = 0;
      let errorCount = 0;
      const BATCH_SIZE = 50; // Smaller batch size for more reliability
      
      for (let i = 0; i < cacheTransactions.length; i += BATCH_SIZE) {
        const batch = cacheTransactions.slice(i, i + BATCH_SIZE);
        console.log(`CacheOperations: Storing batch ${i}-${i+batch.length} of ${cacheTransactions.length} transactions`);
        
        const { error: txError } = await supabase
          .from('cached_transactions')
          .upsert(batch, { onConflict: 'external_id' });
        
        if (txError) {
          console.error(`CacheOperations: Error storing batch ${i}-${i+batch.length}:`, txError);
          errorCount++;
        } else {
          successCount++;
          console.log(`CacheOperations: Successfully stored batch ${i}-${i+batch.length}`);
        }
      }
      
      // Update the segment status to 'complete' if all transactions were stored successfully
      if (errorCount === 0) {
        const { error: finalSegmentError } = await supabase
          .from('cache_segments')
          .upsert({
            source,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            transaction_count: transactions.length,
            last_refreshed_at: new Date().toISOString(),
            status: 'complete' // Mark as complete now that all transactions are stored
          }, { onConflict: 'source, start_date, end_date' });
          
        if (finalSegmentError) {
          console.error("CacheOperations: Error updating cache segment status:", finalSegmentError);
        }
      }
      
      // Verify transactions were actually stored by checking count
      const { count, error: countError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact' })
        .eq('source', source)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
      
      if (countError) {
        console.error("CacheOperations: Error verifying stored transactions:", countError);
      } else {
        console.log(`CacheOperations: Verified ${count} transactions in cache after storage`);
        
        // If count is too low, there might be an issue with storage
        if (count && count < transactions.length * 0.9) {
          console.warn(`CacheOperations: Potentially incomplete storage. Expected ~${transactions.length}, found ${count}`);
        }
      }
      
      const success = errorCount === 0 && successCount > 0;
      console.log(`CacheOperations: ${success ? 'Successfully' : 'Partially'} cached ${transactions.length} transactions. Success batches: ${successCount}, Failed batches: ${errorCount}`);
      return success;
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
  },
  
  /**
   * Verify cache integrity for a date range
   */
  verifyCacheIntegrity: async (
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ isConsistent: boolean, segmentCount: number, transactionCount: number }> => {
    try {
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // Check if segments exist
      const { data: segments, error: segmentError } = await supabase
        .from('cache_segments')
        .select('*')
        .eq('source', source)
        .lte('start_date', formattedStartDate)
        .gte('end_date', formattedEndDate);
      
      if (segmentError) {
        console.error("CacheOperations: Error verifying cache segments:", segmentError);
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      if (!segments || segments.length === 0) {
        console.log("CacheOperations: No cache segments found for verification");
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      // Check if transactions exist
      const { count, error: countError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact' })
        .eq('source', source)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
      
      if (countError) {
        console.error("CacheOperations: Error counting cached transactions:", countError);
        return { isConsistent: false, segmentCount: segments.length, transactionCount: 0 };
      }
      
      const transactionCount = count || 0;
      const segmentCount = segments.length;
      
      // Calculate the expected transaction count from segments
      const expectedCount = segments.reduce((total, segment) => total + segment.transaction_count, 0);
      
      // Consistency check: we should have transactions if we have segments
      // Also, the actual count should be at least 90% of the expected count
      const isConsistent = segmentCount > 0 && transactionCount > 0 && transactionCount >= expectedCount * 0.9;
      
      console.log(`CacheOperations: Cache integrity check - Segments: ${segmentCount}, Expected Transactions: ${expectedCount}, Actual Transactions: ${transactionCount}, Consistent: ${isConsistent}`);
      
      // If inconsistent, log detailed information to help diagnose the issue
      if (!isConsistent) {
        console.warn(`CacheOperations: Cache inconsistency detected - ${transactionCount} transactions found, but segments expect ${expectedCount}`);
        segments.forEach(segment => {
          console.log(`CacheOperations: Segment ${segment.source} from ${segment.start_date} to ${segment.end_date}: ${segment.transaction_count} expected transactions, status: ${segment.status}`);
        });
      }
      
      return { isConsistent, segmentCount, transactionCount };
    } catch (err) {
      console.error("CacheOperations: Error in verifyCacheIntegrity", err);
      return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
    }
  },
  
  /**
   * Repair cache inconsistencies by syncing segment counts with actual transaction counts
   */
  repairCacheSegments: async (
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    try {
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      console.log(`CacheOperations: Attempting to repair cache segments for ${source} from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Get actual transaction count
      const { count, error: countError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact' })
        .eq('source', source)
        .gte('date', formattedStartDate)
        .lte('date', formattedEndDate);
      
      if (countError) {
        console.error("CacheOperations: Error counting transactions for repair:", countError);
        return false;
      }
      
      const actualCount = count || 0;
      
      if (actualCount === 0) {
        console.log("CacheOperations: No transactions found to repair segments");
        return false;
      }
      
      // Update segments with the actual count
      const { error: updateError } = await supabase
        .from('cache_segments')
        .upsert({
          source,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          transaction_count: actualCount,
          status: 'complete',
          last_refreshed_at: new Date().toISOString()
        }, { onConflict: 'source, start_date, end_date' });
      
      if (updateError) {
        console.error("CacheOperations: Error updating cache segment during repair:", updateError);
        return false;
      }
      
      console.log(`CacheOperations: Successfully repaired cache segments for ${source}. Set transaction count to ${actualCount}`);
      return true;
      
    } catch (err) {
      console.error("CacheOperations: Error in repairCacheSegments", err);
      return false;
    }
  },
  
  /**
   * Clear cache data
   * @param options Clear cache options
   * @returns Promise<boolean> Success status
   */
  clearCache: async (
    options?: {
      source?: 'Zoho' | 'Stripe' | 'all';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<boolean> => {
    try {
      console.log("CacheOperations: Clearing cache with options:", options);
      
      // Prepare query builders for both tables
      let transactionsQuery = supabase.from('cached_transactions').delete();
      let segmentsQuery = supabase.from('cache_segments').delete();
      
      // Apply source filter if specified
      if (options?.source && options.source !== 'all') {
        transactionsQuery = transactionsQuery.eq('source', options.source);
        segmentsQuery = segmentsQuery.eq('source', options.source);
        console.log(`CacheOperations: Filtering by source: ${options.source}`);
      }
      
      // Apply date range filter if specified
      if (options?.startDate && options?.endDate) {
        const formattedStartDate = formatDateYYYYMMDD(options.startDate);
        const formattedEndDate = formatDateYYYYMMDD(options.endDate);
        
        transactionsQuery = transactionsQuery
          .gte('date', formattedStartDate)
          .lte('date', formattedEndDate);
        
        // For segments, consider any overlap with the specified date range
        segmentsQuery = segmentsQuery
          .or(`start_date.lte.${formattedEndDate},end_date.gte.${formattedStartDate}`);
        
        console.log(`CacheOperations: Filtering by date range: ${formattedStartDate} to ${formattedEndDate}`);
      }
      
      // First count the data to be deleted for logging
      const countTransactionsQuery = supabase
        .from('cached_transactions')
        .select('*', { count: 'exact' });
        
      const countSegmentsQuery = supabase
        .from('cache_segments')
        .select('*', { count: 'exact' });
      
      // Apply same filters to count queries
      if (options?.source && options.source !== 'all') {
        countTransactionsQuery.eq('source', options.source);
        countSegmentsQuery.eq('source', options.source);
      }
      
      if (options?.startDate && options?.endDate) {
        const formattedStartDate = formatDateYYYYMMDD(options.startDate);
        const formattedEndDate = formatDateYYYYMMDD(options.endDate);
        
        countTransactionsQuery
          .gte('date', formattedStartDate)
          .lte('date', formattedEndDate);
          
        countSegmentsQuery
          .or(`start_date.lte.${formattedEndDate},end_date.gte.${formattedStartDate}`);
      }
      
      // Execute count queries
      const [transactionsCountResult, segmentsCountResult] = await Promise.all([
        countTransactionsQuery,
        countSegmentsQuery
      ]);
      
      const transactionsCount = transactionsCountResult.count || 0;
      const segmentsCount = segmentsCountResult.count || 0;
      
      console.log(`CacheOperations: About to delete ${transactionsCount} transactions and ${segmentsCount} segments`);
      
      // Delete records from cache_metrics first (no foreign key constrains)
      let metricsQuery = supabase.from('cache_metrics').delete();
      
      if (options?.source && options.source !== 'all') {
        metricsQuery = metricsQuery.eq('source', options.source);
      }
      
      if (options?.startDate && options?.endDate) {
        const formattedStartDate = formatDateYYYYMMDD(options.startDate);
        const formattedEndDate = formatDateYYYYMMDD(options.endDate);
        
        metricsQuery = metricsQuery
          .gte('start_date', formattedStartDate)
          .lte('end_date', formattedEndDate);
      }
      
      // Execute delete queries
      const [transactionsResult, segmentsResult, metricsResult] = await Promise.all([
        transactionsQuery,
        segmentsQuery,
        metricsQuery
      ]);
      
      // Check for errors
      if (transactionsResult.error) {
        console.error("CacheOperations: Error deleting transactions:", transactionsResult.error);
        return false;
      }
      
      if (segmentsResult.error) {
        console.error("CacheOperations: Error deleting segments:", segmentsResult.error);
        return false;
      }
      
      if (metricsResult.error) {
        console.error("CacheOperations: Error deleting metrics:", metricsResult.error);
        // Non-critical, continue
      }
      
      // Reset the last cache check result
      lastCacheCheckResult = null;
      
      console.log(`CacheOperations: Successfully cleared cache data. Removed ${transactionsCount} transactions and ${segmentsCount} segments.`);
      return true;
    } catch (err) {
      console.error("CacheOperations: Error in clearCache", err);
      return false;
    }
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats: async (): Promise<{
    transactions: { source: string; count: number }[];
    segments: { source: string; count: number }[];
  }> => {
    try {
      // Get transaction counts by source
      const { data: txData, error: txError } = await supabase
        .from('cached_transactions')
        .select('source');
      
      if (txError) {
        console.error("CacheOperations: Error getting transaction stats:", txError);
        return { transactions: [], segments: [] };
      }
      
      // Manually count transactions by source
      const txCountMap = new Map<string, number>();
      if (txData) {
        txData.forEach(record => {
          const source = record.source;
          txCountMap.set(source, (txCountMap.get(source) || 0) + 1);
        });
      }
      
      const transactions = Array.from(txCountMap.entries()).map(([source, count]) => ({
        source,
        count
      }));
      
      // Get segment counts by source using the same approach
      const { data: segData, error: segError } = await supabase
        .from('cache_segments')
        .select('source');
      
      if (segError) {
        console.error("CacheOperations: Error getting segment stats:", segError);
        return { 
          transactions, 
          segments: [] 
        };
      }
      
      // Manually count segments by source
      const segCountMap = new Map<string, number>();
      if (segData) {
        segData.forEach(record => {
          const source = record.source;
          segCountMap.set(source, (segCountMap.get(source) || 0) + 1);
        });
      }
      
      const segments = Array.from(segCountMap.entries()).map(([source, count]) => ({
        source,
        count
      }));
      
      return {
        transactions,
        segments
      };
    } catch (err) {
      console.error("CacheOperations: Error in getCacheStats", err);
      return { transactions: [], segments: [] };
    }
  }
};
