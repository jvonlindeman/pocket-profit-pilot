
import { supabase } from "../../../integrations/supabase/client";
import { CacheSource } from "../types";

/**
 * CacheIntegrityMetrics handles cache integrity verification
 */
export class CacheIntegrityMetrics {
  /**
   * Verify cache integrity for a date range
   */
  async verifyCacheIntegrity(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ): Promise<{
    isConsistent: boolean;
    segmentCount: number;
    transactionCount: number;
  }> {
    try {
      // Count segments
      const { count: segmentCount, error: segmentError } = await supabase
        .from('cache_segments')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .lte('start_date', startDate)
        .gte('end_date', endDate)
        .eq('status', 'complete');
        
      if (segmentError) {
        console.error("Error counting cache segments:", segmentError);
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      // Count transactions
      const { count: transactionCount, error: txError } = await supabase
        .from('cached_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('source', source)
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (txError) {
        console.error("Error counting cache transactions:", txError);
        return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
      }
      
      // Check consistency
      const isConsistent = segmentCount > 0 && transactionCount > 0;
      
      return {
        isConsistent,
        segmentCount: segmentCount || 0,
        transactionCount: transactionCount || 0
      };
    } catch (err) {
      console.error("Exception verifying cache integrity:", err);
      return { isConsistent: false, segmentCount: 0, transactionCount: 0 };
    }
  }
}

export const cacheIntegrityMetrics = new CacheIntegrityMetrics();
