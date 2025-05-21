
import { Transaction } from "../../../types/financial";
import { CacheSource } from "../types";
import { supabase } from "../../../integrations/supabase/client";

/**
 * Functions for handling monthly storage-related operations
 */
export const monthlyStorage = {
  /**
   * Check if a month is cached
   */
  async isMonthCached(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<{ isCached: boolean, transaction_count?: number }> {
    try {
      const { data, error } = await supabase.rpc('is_month_cached', {
        p_source: source,
        p_year: year,
        p_month: month
      });
      
      if (error) {
        console.error("Error checking if month is cached:", error);
        return { isCached: false };
      }
      
      return { 
        isCached: data?.[0]?.is_cached || false,
        transaction_count: data?.[0]?.transaction_count
      };
    } catch (err) {
      console.error("Error in isMonthCached:", err);
      return { isCached: false };
    }
  },

  /**
   * Get transactions for a specific month
   */
  async getMonthTransactions(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('cached_transactions')
        .select('*')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month);
      
      if (error) {
        console.error("Error retrieving month transactions:", error);
        return [];
      }
      
      return data as Transaction[];
    } catch (err) {
      console.error("Error in getMonthTransactions:", err);
      return [];
    }
  },

  /**
   * Store transactions for a specific month
   */
  async storeMonthTransactions(
    source: CacheSource | string,
    year: number,
    month: number,
    transactions: Transaction[]
  ): Promise<boolean> {
    try {
      // First check if we already have a monthly_cache entry
      const { data: existingCache } = await supabase
        .from('monthly_cache')
        .select('id')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month)
        .single();
      
      // Prepare transactions with year and month
      const preparedTransactions = transactions.map(tx => ({
        ...tx,
        year,
        month,
        source
      }));
      
      // Insert the transactions
      const { error: transactionError } = await supabase
        .from('cached_transactions')
        .upsert(
          preparedTransactions,
          { 
            onConflict: 'source,external_id',
            ignoreDuplicates: false
          }
        );
      
      if (transactionError) {
        console.error("Error storing month transactions:", transactionError);
        return false;
      }
      
      // Create or update the monthly_cache entry
      const { error: cacheError } = await supabase
        .from('monthly_cache')
        .upsert({
          source,
          year,
          month,
          transaction_count: transactions.length,
          status: 'complete',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source,year,month'
        });
      
      if (cacheError) {
        console.error("Error updating monthly cache:", cacheError);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error in storeMonthTransactions:", err);
      return false;
    }
  },

  /**
   * Get information about a monthly cache entry
   */
  async getMonthCacheInfo(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<{ id: string; transaction_count: number } | null> {
    try {
      const { data, error } = await supabase
        .from('monthly_cache')
        .select('id, transaction_count')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error("Error retrieving month cache info:", error);
        }
        return null;
      }
      
      return data as { id: string; transaction_count: number };
    } catch (err) {
      console.error("Error in getMonthCacheInfo:", err);
      return null;
    }
  },

  /**
   * Fix transactions with missing year/month values
   * Added to support the cache migration process
   */
  async fixLegacyTransactions(source?: CacheSource): Promise<number> {
    try {
      let query = supabase
        .from('cached_transactions')
        .select('id, date')
        .is('year', null);
      
      if (source) {
        query = query.eq('source', source);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error finding transactions with missing year/month:", error);
        return 0;
      }
      
      if (!data || data.length === 0) {
        console.log("No transactions found with missing year/month values");
        return 0;
      }
      
      // Prepare batch of transactions to update
      const updates = data.map(tx => {
        const txDate = new Date(tx.date);
        return {
          id: tx.id,
          year: txDate.getFullYear(),
          month: txDate.getMonth() + 1
        };
      });
      
      // Batch the updates in chunks of 1000
      const batchSize = 1000;
      let updatedCount = 0;
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const { error: updateError } = await supabase
          .from('cached_transactions')
          .upsert(batch);
        
        if (updateError) {
          console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
        } else {
          updatedCount += batch.length;
        }
      }
      
      console.log(`Successfully updated ${updatedCount} transactions with missing year/month values`);
      return updatedCount;
    } catch (err) {
      console.error("Error fixing legacy transactions:", err);
      return 0;
    }
  }
};
