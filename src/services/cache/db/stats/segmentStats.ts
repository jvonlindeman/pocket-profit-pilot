
import { CacheSource } from "../../types";
import { StatsBaseRepository } from "./statsBase";

/**
 * Repository for segment statistics operations
 */
export class SegmentStatsRepository extends StatsBaseRepository {
  /**
   * Get cache segments by source
   */
  async getSegmentsBySource(): Promise<Record<string, any[]>> {
    try {
      // Get all cache segments
      const { data, error } = await this.getClient()
        .from('cache_segments')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) {
        this.logStatError("Error getting cache segments", error);
        return {};
      }
      
      // Group by source
      const segmentsBySource: Record<string, any[]> = {};
      if (data) {
        data.forEach(item => {
          if (!segmentsBySource[item.source]) {
            segmentsBySource[item.source] = [];
          }
          segmentsBySource[item.source].push(item);
        });
      }
      
      return segmentsBySource;
    } catch (err) {
      this.logStatError("Exception getting cache segments", err);
      return {};
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
        this.logStatError("Error deleting cache segments", error);
        return false;
      }
      
      return true;
    } catch (err) {
      this.logStatError("Exception deleting cache segments", err);
      return false;
    }
  }
}

export const segmentStatsRepository = new SegmentStatsRepository();
