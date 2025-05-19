
import { Transaction } from "../../../types/financial";
import { CacheDbClient } from "./client";
import { CacheSource } from "../types";

/**
 * TransactionRepository handles all transaction-specific database operations
 */
export class TransactionRepository extends CacheDbClient {
  /**
   * Retrieve transactions from cache
   */
  async getTransactions(
    source: CacheSource | string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    try {
      console.log(`Getting cached transactions for ${source} from ${startDate} to ${endDate}`);
      
      const { data, error } = await this.getClient()
        .from('cached_transactions')
        .select('*')
        .eq('source', source)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
        
      if (error) {
        this.logError("Error fetching cached transactions", error);
        return [];
      }
      
      console.log(`Retrieved ${data?.length || 0} cached transactions`);
      
      return data as Transaction[];
    } catch (err) {
      this.logError("Exception retrieving transactions", err);
      return [];
    }
  }

  /**
   * Store transactions in cache
   */
  async storeTransactions(
    source: CacheSource | string,
    startDate: string,
    endDate: string,
    transactions: Transaction[],
    segmentId: string
  ): Promise<boolean> {
    try {
      console.log(`Storing ${transactions.length} transactions in cache for ${source}...`);
      
      // Format transactions for the database
      const dbTransactions = transactions.map(t => ({
        external_id: t.id,
        date: t.date.split('T')[0], // Ensure we just get the date part
        amount: t.amount,
        description: t.description,
        category: t.category,
        type: t.type,
        source: t.source,
        fees: t.fees || null,
        gross: t.gross || null,
        metadata: t.metadata || {},
        fetched_at: new Date().toISOString()
      }));
      
      // Store transactions in batches to avoid payload limits
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < dbTransactions.length; i += batchSize) {
        const batch = dbTransactions.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      // Store each batch
      let totalStored = 0;
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const { error: batchError } = await this.getClient()
          .from('cached_transactions')
          .upsert(batch, { 
            onConflict: 'source,external_id',
            ignoreDuplicates: true
          });
          
        if (batchError) {
          this.logError(`Error storing batch ${i+1}/${batches.length}`, batchError);
          return false;
        }
        
        totalStored += batch.length;
        console.log(`Stored batch ${i+1}/${batches.length} (${batch.length} transactions)`);
      }
      
      console.log(`Successfully stored ${totalStored} transactions in cache`);
      return true;
    } catch (err) {
      this.logError("Exception storing transactions in cache", err);
      return false;
    }
  }
}

export const transactionRepository = new TransactionRepository();
