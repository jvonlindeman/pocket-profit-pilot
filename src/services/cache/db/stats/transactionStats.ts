
import { CacheSource } from "../../types";
import { StatsBaseRepository } from "./statsBase";

/**
 * Repository for transaction statistics operations
 */
export class TransactionStatsRepository extends StatsBaseRepository {
  /**
   * Get transaction counts by source
   */
  async getTransactionCounts(): Promise<Record<string, number>> {
    try {
      // Get count of transactions by source
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source')
        .not('source', 'is', null);
      
      if (error) {
        this.logStatError("Error getting transaction counts", error);
        return {};
      }
      
      // Format the counts manually
      const counts: Record<string, number> = {};
      if (data) {
        // Group by source and count
        data.forEach(item => {
          const source = item.source;
          counts[source] = (counts[source] || 0) + 1;
        });
      }
      
      return counts;
    } catch (err) {
      this.logStatError("Exception getting transaction counts", err);
      return {};
    }
  }

  /**
   * Get transaction counts by month and source
   */
  async getTransactionCountsByMonth(): Promise<Record<string, Record<string, number>>> {
    try {
      // Get transactions grouped by year, month and source
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source, year, month')
        .not('year', 'is', null)
        .not('month', 'is', null);
      
      if (error) {
        this.logStatError("Error getting transaction counts by month", error);
        return {};
      }
      
      // Format the counts manually
      const countsByMonth: Record<string, Record<string, number>> = {};
      if (data) {
        data.forEach(item => {
          // Convert to string for consistent typing
          const year = String(item.year);
          const month = String(item.month).padStart(2, '0');
          const key = `${year}-${month}`;
          const source = item.source;
          
          if (!countsByMonth[key]) {
            countsByMonth[key] = {};
          }
          countsByMonth[key][source] = (countsByMonth[key][source] || 0) + 1;
        });
      }
      
      return countsByMonth;
    } catch (err) {
      this.logStatError("Exception getting transaction counts by month", err);
      return {};
    }
  }

  /**
   * Delete cached transactions
   */
  async deleteTransactions(
    source?: CacheSource,
    startDate?: string,
    endDate?: string
  ): Promise<boolean> {
    try {
      let txQuery = this.getClient().from('cached_transactions').delete();
      
      if (source) {
        txQuery = txQuery.eq('source', source);
      }
      
      if (startDate && endDate) {
        txQuery = txQuery
          .gte('date', startDate)
          .lte('date', endDate);
      }
      
      const { error } = await txQuery;
      
      if (error) {
        this.logStatError("Error clearing cached transactions", error);
        return false;
      }

      return true;
    } catch (err) {
      this.logStatError("Exception clearing cached transactions", err);
      return false;
    }
  }
}

export const transactionStatsRepository = new TransactionStatsRepository();
