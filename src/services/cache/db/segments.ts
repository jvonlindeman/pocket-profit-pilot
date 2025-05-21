
import { CacheDbClient } from "./client";
import { CacheSource, CacheSegmentInfo } from "../types";

/**
 * SegmentRepository handles all segment-specific database operations
 */
export class SegmentRepository extends CacheDbClient {
  /**
   * Check if a date range exists in cache using database function
   */
  async checkDateRangeCached(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ): Promise<{
    is_cached: boolean;
    is_partial: boolean;
    segments_found: number;
    missing_start_date: string | null;
    missing_end_date: string | null;
  } | null> {
    try {
      const { data, error } = await this.getClient().rpc('is_date_range_cached', {
        p_source: source,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      if (error) {
        this.logError("Error checking cache via RPC", error);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.warn("No cache data returned from RPC call");
        return null;
      }
      
      return data[0];
    } catch (err) {
      this.logError("Exception checking cache status", err);
      return null;
    }
  }

  /**
   * Create a new cache segment
   */
  async createSegment(
    source: CacheSource | string,
    startDate: string,
    endDate: string,
    transactionCount: number
  ): Promise<{ success: boolean; segmentId?: string }> {
    try {
      const { data, error } = await this.getClient()
        .from('cache_segments')
        .insert({
          source,
          start_date: startDate,
          end_date: endDate,
          transaction_count: transactionCount,
          status: 'complete',
          last_refreshed_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        this.logError("Error creating cache segment", error);
        return { success: false };
      }
      
      return { success: true, segmentId: data.id };
    } catch (err) {
      this.logError("Exception creating cache segment", err);
      return { success: false };
    }
  }

  /**
   * Update an existing segment
   */
  async updateSegment(
    segmentId: string, 
    status: string, 
    transactionCount?: number
  ): Promise<boolean> {
    try {
      const updateData: any = { 
        status, 
        last_refreshed_at: new Date().toISOString() 
      };
      
      if (transactionCount !== undefined) {
        updateData.transaction_count = transactionCount;
      }
      
      const { error } = await this.getClient()
        .from('cache_segments')
        .update(updateData)
        .eq('id', segmentId);
        
      if (error) {
        this.logError("Error updating cache segment", error);
        return false;
      }
      
      return true;
    } catch (err) {
      this.logError("Exception updating cache segment", err);
      return false;
    }
  }

  /**
   * Get cache segment information
   */
  async getCacheSegmentInfo(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ): Promise<CacheSegmentInfo | null> {
    try {
      const { data, error } = await this.getClient()
        .from('cache_segments')
        .select('id, transaction_count')
        .eq('source', source)
        .lte('start_date', startDate)
        .gte('end_date', endDate)
        .eq('status', 'complete')
        .limit(1)
        .maybeSingle();
        
      if (error || !data) {
        return null;
      }
      
      return data as CacheSegmentInfo;
    } catch (err) {
      this.logError("Exception getting cache segment info", err);
      return null;
    }
  }

  /**
   * Delete cache segments
   */
  async deleteSegments(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      let segmentQuery = this.getClient().from('cache_segments').delete();
      
      if (source) {
        segmentQuery = segmentQuery.eq('source', source);
      }
      
      if (startDate && endDate) {
        segmentQuery = segmentQuery
          .gte('start_date', startDate)
          .lte('end_date', endDate);
      }
      
      const { error } = await segmentQuery;
      
      if (error) {
        this.logError("Error deleting cache segments", error);
        return false;
      }
      
      return true;
    } catch (err) {
      this.logError("Exception deleting cache segments", err);
      return false;
    }
  }
}

export const segmentRepository = new SegmentRepository();
