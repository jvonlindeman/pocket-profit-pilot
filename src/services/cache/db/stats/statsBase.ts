
import { CacheDbClient } from "../client";
import { logError } from "../../../utils/logging";

/**
 * Base class for statistics repositories
 * Provides shared functionality for stats operations
 */
export class StatsBaseRepository extends CacheDbClient {
  /**
   * Log error with context
   */
  protected logStatError(message: string, error: any): void {
    console.error(`StatsRepository: ${message}:`, error);
  }

  /**
   * Create a default empty statistics response
   */
  protected createEmptyStatsResponse() {
    return {
      totalTransactions: 0,
      transactionsBySource: {},
      monthlyCache: {},
      segments: {},
      transactionsByMonth: {},
      sourcesStats: [],
      lastUpdated: new Date().toISOString()
    };
  }
}
