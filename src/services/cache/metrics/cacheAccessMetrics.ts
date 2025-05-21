
import { supabase } from "../../../integrations/supabase/client";
import { CacheSource } from "../types";

/**
 * CacheAccessMetrics handles recording cache access metrics
 */
export class CacheAccessMetrics {
  /**
   * Record cache access metrics
   */
  async recordCacheAccess(
    source: CacheSource | string,
    startDate: string | Date,
    endDate: string | Date,
    cacheHit: boolean,
    partialHit: boolean,
    transactionCount?: number,
    refreshTriggered = false
  ): Promise<boolean> {
    try {
      // Format dates if they are Date objects
      const formattedStartDate = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      const formattedEndDate = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      
      // Insert cache metrics record
      const { error } = await supabase
        .from('cache_metrics')
        .insert({
          source,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          cache_hit: cacheHit,
          partial_hit: partialHit,
          refresh_triggered: refreshTriggered,
          transaction_count: transactionCount,
          user_agent: navigator.userAgent
        });
      
      if (error) {
        console.error("Error recording cache metrics:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Exception recording cache access:", err);
      return false;
    }
  }
  
  /**
   * Record cache update metrics
   */
  async recordCacheUpdate(
    source: CacheSource | string,
    startDate: string | Date,
    endDate: string | Date,
    transactionCount: number
  ): Promise<boolean> {
    try {
      // Format dates if they are Date objects
      const formattedStartDate = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0];
      const formattedEndDate = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0];
      
      // Insert cache metrics record for an update
      const { error } = await supabase
        .from('cache_metrics')
        .insert({
          source,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          cache_hit: false,
          partial_hit: false,
          refresh_triggered: true,
          transaction_count: transactionCount,
          user_agent: navigator.userAgent
        });
      
      if (error) {
        console.error("Error recording cache update metrics:", error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Exception recording cache update:", err);
      return false;
    }
  }
  
  /**
   * Record generic cache operation
   */
  async recordCacheOperation(
    source: CacheSource | string,
    startDate: string | Date,
    endDate: string | Date,
    operation: string
  ): Promise<boolean> {
    try {
      // Format dates if they are Date objects
      const formattedStartDate = typeof startDate === 'string' ? 
        (startDate === 'all' ? new Date(2020, 0, 1).toISOString().split('T')[0] : startDate) : 
        startDate.toISOString().split('T')[0];
      
      const formattedEndDate = typeof endDate === 'string' ? 
        (endDate === 'all' ? new Date().toISOString().split('T')[0] : endDate) : 
        endDate.toISOString().split('T')[0];
      
      // Insert cache metrics record for operation
      const { error } = await supabase
        .from('cache_metrics')
        .insert({
          source,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          cache_hit: false,
          partial_hit: false,
          refresh_triggered: operation === 'refresh',
          metadata: { operation },
          user_agent: navigator.userAgent
        });
      
      if (error) {
        console.error(`Error recording cache ${operation} metrics:`, error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error(`Exception recording cache ${operation}:`, err);
      return false;
    }
  }
}

export const cacheAccessMetrics = new CacheAccessMetrics();
