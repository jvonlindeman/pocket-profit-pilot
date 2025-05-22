
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
      // Get count of transactions by source using SQL aggregation
      // Note: we're using a raw count query with group by since the groupBy method isn't available
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source, count(*)', { count: 'exact' })
        .not('source', 'is', null);
      
      if (error) {
        this.logStatError("Error getting transaction counts", error);
        return {};
      }
      
      // Format the counts
      const counts: Record<string, number> = {};
      if (data) {
        data.forEach(item => {
          counts[item.source] = parseInt(String(item.count));
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
      // Note: we're using a raw query since the groupBy method isn't available
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source, year, month, count(*)', { count: 'exact' })
        .not('year', 'is', null)
        .not('month', 'is', null);
      
      if (error) {
        this.logStatError("Error getting transaction counts by month", error);
        return {};
      }
      
      // Format the counts
      const countsByMonth: Record<string, Record<string, number>> = {};
      if (data) {
        data.forEach(item => {
          const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
          if (!countsByMonth[key]) {
            countsByMonth[key] = {};
          }
          countsByMonth[key][item.source] = parseInt(String(item.count));
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
