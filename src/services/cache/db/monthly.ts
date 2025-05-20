import { CacheDbClient } from "./client";
import { CacheSource } from "../types";
import { Transaction } from "../../../types/financial";
import { supabase } from "../../../integrations/supabase/client";

/**
 * MonthlyRepository handles all month-based cache operations
 */
export class MonthlyRepository extends CacheDbClient {
  /**
   * Check if a specific month is cached for a source
   */
  async isMonthCached(
    source: CacheSource | string,
    year: number,
    month: number
  ): Promise<{ isCached: boolean, transactionCount: number }> {
    try {
      // Call the database function to check if month is cached
      const { data, error } = await supabase
        .rpc('is_month_cached', {
          p_source: source,
          p_year: year,
          p_month: month
        });

      if (error) {
        this.logError("Error checking if month is cached", error);
        return { isCached: false, transactionCount: 0 };
      }

      if (data && data.length > 0) {
        return { 
          isCached: data[0].is_cached || false, 
          transactionCount: data[0].transaction_count || 0 
        };
      }

      return { isCached: false, transactionCount: 0 };
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
      const { data, error } = await supabase
        .from('cached_transactions')
        .select('*')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month);

      if (error) {
        this.logError("Error fetching monthly transactions", error);
        return [];
      }

      return data as Transaction[];
    } catch (err) {
      this.logError("Exception retrieving monthly transactions", err);
      return [];
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
      console.log(`MonthlyRepository: Storing ${transactions.length} transactions for ${source} ${year}-${month}...`);
      console.log(`Transaction validation before storage: First transaction sample:`, 
        transactions.length > 0 ? JSON.stringify(transactions[0], null, 2) : "No transactions");
      
      // Format transactions for the database, ensuring year and month are set
      const dbTransactions = transactions.map((t, index) => {
        try {
          // Validate and assign default values for required fields
          if (!t.id) {
            console.error(`Missing ID for transaction at index ${index}`);
            t.id = `generated-${Date.now()}-${index}`;
          }
          
          // Handle external_id (now in the Transaction type as optional)
          const external_id = t.external_id || t.id;
          
          if (!t.date) {
            console.error(`Missing date for transaction ${t.id}`);
            t.date = new Date(year, month - 1, 1).toISOString().split('T')[0];
          }
          
          if (t.amount === undefined || t.amount === null) {
            console.error(`Missing amount for transaction ${t.id}`);
            t.amount = 0;
          }
          
          if (!t.type) {
            console.error(`Missing type for transaction ${t.id}`);
            // Use a type-safe value that matches the expected union type
            t.type = 'income' as 'income' | 'expense';
          }
          
          if (!t.source) {
            console.error(`Missing source for transaction ${t.id}`);
            // Cast source to the correct type
            t.source = source as 'Zoho' | 'Stripe';
          }

          const transactionDate = new Date(t.date);
          
          return {
            external_id: external_id, // Use the validated external_id
            date: t.date.split('T')[0], // Ensure we just get the date part
            year: year,
            month: month,
            amount: t.amount,
            description: t.description || null,
            category: t.category || null,
            type: t.type,
            source: t.source,
            fees: t.fees || null,
            gross: t.gross || null,
            metadata: t.metadata || {},
            fetched_at: new Date().toISOString()
          };
        } catch (err) {
          console.error(`Error formatting transaction ${t.id || index}:`, err);
          throw err; // Re-throw to stop the process
        }
      });
      
      console.log(`MonthlyRepository: Formatted ${dbTransactions.length} transactions for database`);
      
      // Store transactions in batches to avoid payload limits
      const batchSize = 50; // Reduced batch size for better error tracking
      let totalStored = 0;
      let successfulBatches = 0;
      
      for (let i = 0; i < dbTransactions.length; i += batchSize) {
        const batch = dbTransactions.slice(i, i + batchSize);
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(dbTransactions.length/batchSize)} with ${batch.length} transactions`);
        console.log(`First transaction in batch:`, JSON.stringify(batch[0], null, 2));
        
        const { error } = await supabase
          .from('cached_transactions')
          .upsert(batch, { 
            onConflict: 'source,external_id',
            ignoreDuplicates: true
          });
          
        if (error) {
          this.logError(`Error storing batch ${i/batchSize + 1}`, error);
          console.error(`Failed transaction sample:`, JSON.stringify(batch[0], null, 2));
        } else {
          totalStored += batch.length;
          successfulBatches++;
          console.log(`Stored batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(dbTransactions.length/batchSize)} (${batch.length} transactions)`);
        }
      }
      
      // Only create/update monthly cache entry if at least some transactions were stored successfully
      if (successfulBatches > 0) {
        // Create or update monthly cache entry
        const { error: monthlyError } = await supabase
          .from('monthly_cache')
          .upsert({
            source: source,
            year: year,
            month: month,
            transaction_count: transactions.length,
            status: 'complete',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'source,year,month'
          });
        
        if (monthlyError) {
          this.logError("Error updating monthly cache", monthlyError);
          return false;
        }
        
        console.log(`Successfully stored ${totalStored} transactions for ${source} ${year}-${month}`);
        
        // Verify the transactions were stored
        const verificationCheck = await this.getMonthTransactions(source, year, month);
        console.log(`Verification check: Found ${verificationCheck.length} transactions in database after storage`);
        
        return true;
      }
      
      return false;
    } catch (err) {
      this.logError("Exception storing monthly transactions", err);
      console.error("Stack trace:", err instanceof Error ? err.stack : 'Unknown error');
      return false;
    }
  }

  /**
   * Get all cached months for a source
   */
  async getCachedMonths(source: CacheSource | string): Promise<{ year: number, month: number, count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('monthly_cache')
        .select('*')
        .eq('source', source)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        this.logError("Error fetching cached months", error);
        return [];
      }

      return data.map(item => ({
        year: item.year,
        month: item.month,
        count: item.transaction_count
      }));
    } catch (err) {
      this.logError("Exception retrieving cached months", err);
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
      const { data, error } = await supabase
        .from('monthly_cache')
        .select('id, transaction_count')
        .eq('source', source)
        .eq('year', year)
        .eq('month', month)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        transaction_count: data.transaction_count
      };
    } catch (err) {
      console.error("Exception getting month cache info:", err);
      return null;
    }
  }

  /**
   * Fix legacy transactions with missing year/month values
   */
  async fixLegacyTransactions(source?: CacheSource): Promise<number> {
    try {
      // First, fetch all transactions with null year/month values
      let query = supabase
        .from('cached_transactions')
        .select('*')
        .is('year', null)
        .is('month', null);
        
      if (source) {
        query = query.eq('source', source);
      }
      
      const { data, error } = await query.limit(1000);
      
      if (error) {
        this.logError("Error fetching transactions with null year/month", error);
        return 0;
      }
      
      if (!data || data.length === 0) {
        return 0;
      }
      
      console.log(`Found ${data.length} transactions with null year/month values${source ? ' for ' + source : ''}`);
      
      // Fix each transaction
      let fixedCount = 0;
      const batchSize = 100;
      
      // Create properly formatted update objects with all required fields
      const updates = data.map(tx => {
        if (!tx.date) return null;
        
        const txDate = new Date(tx.date);
        return {
          id: tx.id,
          year: txDate.getFullYear(),
          month: txDate.getMonth() + 1, // Convert to 1-indexed month
          // Include all required fields from the original record
          external_id: tx.external_id,
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          source: tx.source,
          // Optional fields
          description: tx.description,
          category: tx.category,
          fees: tx.fees,
          gross: tx.gross,
          metadata: tx.metadata || {}
        };
      }).filter(Boolean);
      
      // Update in batches
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const { error: updateError } = await supabase
          .from('cached_transactions')
          .upsert(batch);
          
        if (updateError) {
          this.logError(`Error updating batch ${Math.floor(i/batchSize) + 1}`, updateError);
        } else {
          fixedCount += batch.length;
        }
      }
      
      return fixedCount;
    } catch (err) {
      this.logError("Exception fixing legacy transactions", err);
      return 0;
    }
  }
}

export const monthlyRepository = new MonthlyRepository();
