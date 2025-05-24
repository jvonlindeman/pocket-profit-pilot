
import { CacheDbClient } from "../db/client";
import { Transaction } from "../../../types/financial";
import { CacheSource } from "../types";

/**
 * MonthlyStorage handles monthly transaction cache operations
 */
export class MonthlyStorage extends CacheDbClient {
  /**
   * Check if a specific month is cached
   */
  async isMonthCached(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<{ isCached: boolean; transactionCount: number }> {
    try {
      console.log(`[MONTHLY_STORAGE_DEBUG] Checking if month is cached: ${source} ${year}/${month}`);
      
      const { data, error } = await this.getClient()
        .rpc('is_month_cached', {
          p_source: source,
          p_year: year,
          p_month: month
        });
        
      if (error) {
        this.logError("Error checking if month is cached", error);
        return { isCached: false, transactionCount: 0 };
      }
      
      const result = data?.[0] || { is_cached: false, transaction_count: 0 };
      console.log(`[MONTHLY_STORAGE_DEBUG] Month cache check result:`, result);
      
      return {
        isCached: result.is_cached,
        transactionCount: result.transaction_count
      };
    } catch (err) {
      this.logError("Exception checking if month is cached", err);
      return { isCached: false, transactionCount: 0 };
    }
  }

  /**
   * Get transactions for a specific month
   */
  async getMonthTransactions(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<Transaction[]> {
    try {
      console.log(`[MONTHLY_STORAGE_DEBUG] Getting month transactions: ${source} ${year}/${month}`);
      
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('*')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month)
        .order('date', { ascending: false });
        
      if (error) {
        this.logError("Error fetching month transactions", error);
        return [];
      }
      
      console.log(`[MONTHLY_STORAGE_DEBUG] Retrieved ${data?.length || 0} transactions for ${year}/${month}`);
      return data as Transaction[];
    } catch (err) {
      this.logError("Exception getting month transactions", err);
      return [];
    }
  }

  /**
   * Store transactions for a specific month with detailed logging
   */
  async storeMonthTransactions(
    source: CacheSource | string,
    year: number,
    month: number,
    transactions: Transaction[]
  ): Promise<boolean> {
    try {
      console.log(`[MONTHLY_STORAGE_DEBUG] Starting to store ${transactions.length} transactions for ${source} ${year}/${month}`);
      
      if (transactions.length === 0) {
        console.warn(`[MONTHLY_STORAGE_DEBUG] No transactions to store for ${year}/${month}`);
        return true;
      }

      // Validate all transactions have required fields
      const invalidTransactions = transactions.filter(tx => 
        !tx.id || tx.amount === undefined || !tx.date || !tx.type || !tx.source
      );
      
      if (invalidTransactions.length > 0) {
        console.error(`[MONTHLY_STORAGE_DEBUG] Found ${invalidTransactions.length} invalid transactions:`, invalidTransactions);
        return false;
      }

      // Prepare transactions for database
      const dbTransactions = transactions.map((tx, index) => {
        const dbTx = {
          external_id: tx.external_id || tx.id,
          date: tx.date.split('T')[0], // Ensure we just get the date part
          amount: tx.amount,
          description: tx.description || '',
          category: tx.category || '',
          type: tx.type,
          source: tx.source,
          fees: tx.fees || null,
          gross: tx.gross || null,
          metadata: tx.metadata || {},
          year: year,
          month: month,
          fetched_at: new Date().toISOString()
        };
        
        console.log(`[MONTHLY_STORAGE_DEBUG] Prepared transaction ${index}:`, {
          external_id: dbTx.external_id,
          date: dbTx.date,
          amount: dbTx.amount,
          year: dbTx.year,
          month: dbTx.month
        });
        
        return dbTx;
      });

      // Store transactions in batches
      const batchSize = 100;
      let totalStored = 0;
      
      for (let i = 0; i < dbTransactions.length; i += batchSize) {
        const batch = dbTransactions.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(dbTransactions.length / batchSize);
        
        console.log(`[MONTHLY_STORAGE_DEBUG] Storing batch ${batchNumber}/${totalBatches} with ${batch.length} transactions`);
        
        const { data, error } = await this.getClient()
          .from('cached_transactions')
          .upsert(batch, { 
            onConflict: 'source,external_id',
            ignoreDuplicates: false
          })
          .select('id');
          
        if (error) {
          console.error(`[MONTHLY_STORAGE_DEBUG] Error storing batch ${batchNumber}:`, error);
          this.logError(`Error storing batch ${batchNumber}/${totalBatches}`, error);
          return false;
        }
        
        const storedCount = data?.length || batch.length;
        totalStored += storedCount;
        console.log(`[MONTHLY_STORAGE_DEBUG] Batch ${batchNumber}/${totalBatches} stored successfully: ${storedCount} transactions`);
      }

      // Update monthly cache record
      console.log(`[MONTHLY_STORAGE_DEBUG] Updating monthly cache record for ${year}/${month}`);
      
      const { error: cacheError } = await this.getClient()
        .from('monthly_cache')
        .upsert({
          source,
          year,
          month,
          transaction_count: totalStored,
          status: 'complete',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source,year,month'
        });

      if (cacheError) {
        console.error(`[MONTHLY_STORAGE_DEBUG] Error updating monthly cache record:`, cacheError);
        this.logError("Error updating monthly cache record", cacheError);
        return false;
      }

      console.log(`[MONTHLY_STORAGE_DEBUG] Successfully stored ${totalStored} transactions and updated cache record for ${source} ${year}/${month}`);
      return true;
    } catch (err) {
      console.error(`[MONTHLY_STORAGE_DEBUG] Exception storing month transactions:`, err);
      this.logError("Exception storing month transactions", err);
      return false;
    }
  }

  /**
   * Get information about a monthly cache entry
   */
  async getMonthCacheInfo(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<{ id: string; transaction_count: number } | null> {
    try {
      const { data, error } = await this.getClient()
        .from('monthly_cache')
        .select('id, transaction_count')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month)
        .eq('status', 'complete')
        .single();
        
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        transaction_count: data.transaction_count
      };
    } catch (err) {
      this.logError("Exception getting month cache info", err);
      return null;
    }
  }

  /**
   * Fix transactions with missing year/month values
   */
  async fixLegacyTransactions(source?: CacheSource): Promise<number> {
    try {
      console.log(`[MONTHLY_STORAGE_DEBUG] Fixing legacy transactions for ${source || 'all sources'}`);
      
      let query = this.getClient()
        .from('cached_transactions')
        .select('id, date, external_id, amount, type, source, description, category, fees, gross, metadata')
        .or('year.is.null,month.is.null');
        
      if (source) {
        query = query.eq('source', source);
      }
      
      const { data: legacyTransactions, error: fetchError } = await query;
      
      if (fetchError) {
        this.logError("Error fetching legacy transactions", fetchError);
        return 0;
      }
      
      if (!legacyTransactions || legacyTransactions.length === 0) {
        console.log("[MONTHLY_STORAGE_DEBUG] No legacy transactions found to fix");
        return 0;
      }
      
      console.log(`[MONTHLY_STORAGE_DEBUG] Found ${legacyTransactions.length} legacy transactions to fix`);
      
      const updates = legacyTransactions.map(tx => {
        const date = new Date(tx.date);
        return {
          id: tx.id,
          external_id: tx.external_id,
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          source: tx.source,
          description: tx.description,
          category: tx.category,
          fees: tx.fees,
          gross: tx.gross,
          metadata: tx.metadata || {},
          year: date.getFullYear(),
          month: date.getMonth() + 1
        };
      });
      
      const batchSize = 100;
      let fixedCount = 0;
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const { error: updateError } = await this.getClient()
          .from('cached_transactions')
          .upsert(batch);
          
        if (updateError) {
          this.logError(`Error updating batch ${Math.floor(i/batchSize) + 1}`, updateError);
        } else {
          fixedCount += batch.length;
        }
      }
      
      console.log(`[MONTHLY_STORAGE_DEBUG] Successfully fixed ${fixedCount} legacy transactions`);
      return fixedCount;
    } catch (err) {
      this.logError("Exception fixing legacy transactions", err);
      return 0;
    }
  }
}

export const monthlyStorage = new MonthlyStorage();
