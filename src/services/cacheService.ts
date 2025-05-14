
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "../types/financial";
import { formatDateYYYYMMDD } from "@/utils/dateUtils";

interface CacheResponse {
  cached: boolean;
  status: string;
  data?: Transaction[];
  partial?: boolean;
  missingRanges?: {
    startDate: string | null;
    endDate: string | null;
  };
  metrics?: {
    source: string;
    startDate: string;
    endDate: string;
    transactionCount?: number;
    fetchDuration?: number;
    cacheHit: boolean;
    partialHit?: boolean;
  };
}

interface CacheResult {
  transactions: Transaction[];
  isCached: boolean;
  isPartialCache: boolean;
  missingRanges?: {
    startDate: string | null;
    endDate: string | null;
  };
  metrics?: {
    source: string;
    startDate: string;
    endDate: string;
    transactionCount: number;
    fetchDuration: number;
  };
}

// Store last cache check result
let lastCacheCheckResult: CacheResponse | null = null;

const CacheService = {
  // Check if data for a date range is in cache
  checkCache: async (
    source: string,
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<CacheResponse> => {
    try {
      console.log(`CacheService: Checking cache for ${source} data from ${startDate} to ${endDate}`);
      
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
        console.error("CacheService: Error checking cache:", error);
        throw new Error(`Cache check failed: ${error.message}`);
      }
      
      // Store last cache check result
      lastCacheCheckResult = data as CacheResponse;
      
      return data as CacheResponse;
    } catch (err) {
      console.error("CacheService: Error in checkCache", err);
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
  
  // Store transactions in cache
  storeTransactions: async (
    source: string,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<boolean> => {
    try {
      console.log(`CacheService: Storing ${transactions.length} ${source} transactions from ${startDate} to ${endDate}`);
      
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
        console.error("CacheService: Error creating cache segment:", segmentError);
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
          console.error("CacheService: Error storing transactions:", txError);
          throw new Error(`Transaction storage failed: ${txError.message}`);
        }
      }
      
      console.log(`CacheService: Successfully cached ${transactions.length} transactions`);
      return true;
    } catch (err) {
      console.error("CacheService: Error in storeTransactions", err);
      return false;
    }
  },
  
  // Get the last cache check result (useful for debugging)
  getLastCacheCheckResult: (): CacheResponse | null => {
    return lastCacheCheckResult;
  },
  
  // Get cache statistics
  getCacheStats: async (): Promise<any> => {
    try {
      // Get total cached transactions
      const { count: transactionCount, error: countError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Get cache segments stats  
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('cache_segments')
        .select('source, transaction_count');
      
      if (segmentsError) throw segmentsError;
      
      // Process segments data manually to group by source
      const segments = segmentsData.reduce((acc: any, curr) => {
        if (!acc[curr.source]) {
          acc[curr.source] = { count: 0, total: 0 };
        }
        acc[curr.source].count++;
        acc[curr.source].total += curr.transaction_count;
        return acc;
      }, {});
      
      const segmentsSummary = Object.entries(segments).map(([source, data]: [string, any]) => ({
        source,
        count: data.count,
        total: data.total
      }));
      
      // Get recent cache metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('cache_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (metricsError) throw metricsError;
      
      // Calculate hit rate manually
      const { data: hitRateData, error: hitRateError } = await supabase
        .from('cache_metrics')
        .select('cache_hit');
      
      if (hitRateError) throw hitRateError;
      
      let hits = 0;
      let misses = 0;
      
      hitRateData.forEach(item => {
        if (item.cache_hit) {
          hits++;
        } else {
          misses++;
        }
      });
      
      const hitRate = hits + misses > 0 ? (hits / (hits + misses) * 100).toFixed(1) + '%' : 'N/A';
      
      return {
        transactionCount,
        segments: segmentsSummary,
        recentMetrics: metrics,
        hitRate,
        hits,
        misses,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      console.error("CacheService: Error getting cache stats:", err);
      return {
        error: err.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }
};

export default CacheService;
