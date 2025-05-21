import { supabase } from "../../../integrations/supabase/client";
import { CacheSource } from "../types";
import { Transaction } from "../../../types/financial";

/**
 * MonthlyStorage handles all database interactions for monthly cached data
 */
export class MonthlyStorage {
  /**
   * Check if a month is cached
   */
  async isMonthCached(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<boolean> {
    try {
      const { data, error } = await this.getClient().rpc('is_month_cached', {
        p_source: source,
        p_year: year,
        p_month: month
      });
      
      if (error) {
        console.error("Error checking if month is cached via RPC", error);
        return false;
      }
      
      if (!data || data.length === 0) {
        return false;
      }
      
      return data[0].is_cached;
    } catch (err) {
      console.error("Exception checking if month is cached:", err);
      return false;
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
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('*')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month);
        
      if (error) {
        console.error("Error getting month transactions:", error);
        return [];
      }
      
      return data as Transaction[];
    } catch (err) {
      console.error("Exception getting month transactions:", err);
      return [];
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
        .maybeSingle();
        
      if (error) {
        console.error("Error getting month cache info:", error);
        return null;
      }
      
      return data ? { id: data.id, transaction_count: data.transaction_count } : null;
    } catch (err) {
      console.error("Exception getting month cache info:", err);
      return null;
    }
  }

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
      console.log(`MonthlyStorage: Storing ${transactions.length} transactions for ${source} ${year}-${month}`);
      
      // Begin transaction
      // 1. Insert or update monthly cache entry
      const { data: existingEntry } = await this.getClient()
        .from('monthly_cache')
        .select('*')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      
      if (existingEntry) {
        // Update existing entry
        const { error: updateError } = await this.getClient()
          .from('monthly_cache')
          .update({
            transaction_count: transactions.length,
            status: 'complete',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEntry.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new entry
        const { error: insertError } = await this.getClient()
          .from('monthly_cache')
          .insert({
            source,
            year,
            month,
            transaction_count: transactions.length,
            status: 'complete'
          });
          
        if (insertError) {
          throw insertError;
        }
      }
      
      // 2. Store transactions in cache - need to ensure all transactions have external_id
      const formattedTransactions = transactions.map(transaction => ({
        year,
        month,
        source,
        id: transaction.id,
        external_id: transaction.external_id || transaction.id, // Ensure external_id is always present
        date: transaction.date,
        amount: transaction.amount,
        description: transaction.description || '',
        category: transaction.category || '',
        type: transaction.type,
        fees: transaction.fees,
        gross: transaction.gross,
        metadata: transaction.metadata
      }));

      // Process transactions in batches to prevent overloading the database
      const BATCH_SIZE = 100;
      for (let i = 0; i < formattedTransactions.length; i += BATCH_SIZE) {
        const batch = formattedTransactions.slice(i, i + BATCH_SIZE);
        
        // First, check for existing transactions to avoid duplicates
        const externalIds = batch.map(tx => tx.external_id);
        
        // Delete existing transactions for these external_ids to avoid conflicts
        const { error: deleteError } = await this.getClient()
          .from('cached_transactions')
          .delete()
          .eq('source', source)
          .in('external_id', externalIds);
          
        if (deleteError) {
          console.error(`Error deleting existing transactions in batch ${i / BATCH_SIZE + 1}:`, deleteError);
        }
        
        // Insert the batch of transactions
        const { error: insertError } = await this.getClient()
          .from('cached_transactions')
          .insert(batch.map(tx => ({
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            description: tx.description,
            external_id: tx.external_id, // Now guaranteed to be present
            fees: tx.fees,
            gross: tx.gross,
            metadata: tx.metadata,
            month: tx.month,
            source: tx.source,
            type: tx.type,
            year: tx.year
          })));
          
        if (insertError) {
          console.error(`Error inserting transactions in batch ${i / BATCH_SIZE + 1}:`, insertError);
          throw insertError;
        }
        
        console.log(`Successfully inserted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(formattedTransactions.length / BATCH_SIZE)}`);
      }
      
      return true;
    } catch (err) {
      console.error("Exception storing monthly transactions:", err);
      return false;
    }
  }

  /**
   * Get Supabase client
   */
  getClient() {
    return supabase;
  }

  /**
   * Log an error
   */
  logError(message: string, error: any) {
    console.error(`MonthlyStorage: ${message}`, error);
  }

  /**
   * Fix transactions with missing year/month values
   */
  async fixLegacyTransactions(source?: CacheSource): Promise<number> {
    try {
      // Get transactions missing year/month
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('id, date')
        .is('year', null);
        
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log("No transactions with missing year/month found");
        return 0;
      }
      
      console.log(`Found ${data.length} transactions with missing year/month to fix`);
      
      // Process in small batches to avoid hitting DB limits
      const BATCH_SIZE = 50;
      let fixedCount = 0;
      
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const updates = batch.map(tx => {
          const date = new Date(tx.date);
          return {
            id: tx.id,
            year: date.getFullYear(),
            month: date.getMonth() + 1
          };
        });
        
        // Update each transaction individually
        for (const update of updates) {
          const { error: updateError } = await this.getClient()
            .from('cached_transactions')
            .update({ year: update.year, month: update.month })
            .eq('id', update.id);
            
          if (!updateError) {
            fixedCount++;
          }
        }
        
        console.log(`Processed batch ${Math.ceil(i / BATCH_SIZE) + 1} of ${Math.ceil(data.length / BATCH_SIZE)}`);
      }
      
      console.log(`Fixed ${fixedCount} transactions with missing year/month values`);
      return fixedCount;
    } catch (err) {
      console.error("Error fixing legacy transactions:", err);
      return 0;
    }
  }
}

export const monthlyStorage = new MonthlyStorage();
