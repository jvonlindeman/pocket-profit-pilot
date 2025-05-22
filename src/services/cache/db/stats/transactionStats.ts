
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
      // Get count of transactions by source using SQL
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source, count(*)')
        .filter('source', 'is', 'not.null')
        .then(result => {
          // Process the result to extract sources and counts
          const processedData = (result.data || []).map(row => ({
            source: row.source,
            count: parseInt(row.count || '0')
          }));
          return { data: processedData, error: result.error };
        });
      
      if (error) {
        this.logStatError("Error getting transaction counts", error);
        return {};
      }
      
      // Format the counts
      const counts: Record<string, number> = {};
      if (data) {
        data.forEach(item => {
          counts[item.source] = parseInt(item.count.toString());
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
      // Get transactions grouped by year, month and source using SQL
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source, year, month, count(*)')
        .filter('year', 'not.is.null')
        .filter('month', 'not.is.null')
        .then(result => {
          // Process the result to extract year, month, source and counts
          const processedData = (result.data || []).map(row => ({
            source: row.source,
            year: row.year,
            month: row.month,
            count: parseInt(row.count || '0')
          }));
          return { data: processedData, error: result.error };
        });
      
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
          countsByMonth[key][item.source] = parseInt(item.count.toString());
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
