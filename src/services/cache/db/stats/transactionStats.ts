
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
      // Using a simpler query approach to avoid type issues
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source');
      
      if (error) {
        this.logStatError("Error getting transaction counts", error);
        return {};
      }
      
      // Count transactions by source manually
      const counts: Record<string, number> = {};
      if (data) {
        data.forEach(item => {
          if (item.source) {
            counts[item.source] = (counts[item.source] || 0) + 1;
          }
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
      // Get transactions with year, month and source
      // Using a simpler query approach to avoid type issues
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('source, year, month')
        .not('year', 'is', null)
        .not('month', 'is', null);
      
      if (error) {
        this.logStatError("Error getting transaction counts by month", error);
        return {};
      }
      
      // Group and count transactions by month and source manually
      const countsByMonth: Record<string, Record<string, number>> = {};
      if (data) {
        data.forEach(item => {
          if (item.year !== null && item.month !== null && item.source) {
            const key = `${item.year}-${String(item.month).padStart(2, '0')}`;
            if (!countsByMonth[key]) {
              countsByMonth[key] = {};
            }
            countsByMonth[key][item.source] = (countsByMonth[key][item.source] || 0) + 1;
          }
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
