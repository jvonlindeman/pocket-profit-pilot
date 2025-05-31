
import { Transaction } from "../../../types/financial";
import { CacheSource } from "../types";
import { monthlyStorage } from "../storage/monthlyStorage";
import { dataIntegrityValidator } from "../validation/dataIntegrity";
import { cacheMetrics } from "../metrics";
import { startOfMonth, endOfMonth, isSameMonth } from "date-fns";

/**
 * Enhanced transaction storage with data preservation and validation
 */
export class EnhancedTransactionStorage {
  /**
   * Store transactions with comprehensive validation and data preservation
   */
  static async storeTransactions(
    source: CacheSource,
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Promise<{ success: boolean; storedCount: number; errors: string[] }> {
    console.log(`[ENHANCED_STORAGE] Starting enhanced storage for ${source}`, {
      source,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      inputCount: transactions.length
    });

    try {
      // Step 1: Validate input data
      if (!transactions || transactions.length === 0) {
        console.warn(`[ENHANCED_STORAGE] No transactions to store for ${source}`);
        return { success: true, storedCount: 0, errors: [] };
      }

      // Step 2: Validate transaction integrity
      const validation = dataIntegrityValidator.validateTransactionBatch(transactions);
      
      if (validation.invalid.length > 0) {
        console.error(`[ENHANCED_STORAGE] Found ${validation.invalid.length} invalid transactions:`, validation.errors);
      }

      if (validation.valid.length === 0) {
        console.error(`[ENHANCED_STORAGE] No valid transactions to store after validation`);
        return { success: false, storedCount: 0, errors: validation.errors };
      }

      console.log(`[ENHANCED_STORAGE] Validated ${validation.valid.length} out of ${transactions.length} transactions`);

      // Step 3: Group transactions by month for optimal storage
      const monthlyGroups = this.groupTransactionsByMonth(validation.valid);
      
      console.log(`[ENHANCED_STORAGE] Grouped transactions into ${monthlyGroups.size} monthly buckets`);

      // Step 4: Store each month's transactions
      let totalStored = 0;
      const allErrors: string[] = [...validation.errors];

      for (const [monthKey, monthTransactions] of monthlyGroups.entries()) {
        const [year, month] = monthKey.split('-').map(Number);
        
        console.log(`[ENHANCED_STORAGE] Storing ${monthTransactions.length} transactions for ${year}/${month}`);
        
        // Ensure all transactions are properly formatted
        const formattedTransactions = this.preserveTransactionData(monthTransactions);
        
        // Store monthly transactions
        const success = await monthlyStorage.storeMonthTransactions(
          source,
          year,
          month,
          formattedTransactions
        );

        if (success) {
          totalStored += formattedTransactions.length;
          console.log(`[ENHANCED_STORAGE] Successfully stored ${formattedTransactions.length} transactions for ${year}/${month}`);
          
          // Record metrics
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = endOfMonth(monthStart);
          
          try {
            await cacheMetrics.recordCacheUpdate(
              source,
              monthStart.toISOString().split('T')[0],
              monthEnd.toISOString().split('T')[0],
              formattedTransactions.length
            );
          } catch (metricsError) {
            console.warn(`[ENHANCED_STORAGE] Failed to record metrics for ${year}/${month}:`, metricsError);
          }
        } else {
          const error = `Failed to store transactions for ${year}/${month}`;
          allErrors.push(error);
          console.error(`[ENHANCED_STORAGE] ${error}`);
        }
      }

      const finalSuccess = totalStored > 0;
      
      console.log(`[ENHANCED_STORAGE] Enhanced storage completed`, {
        success: finalSuccess,
        totalStored,
        errorCount: allErrors.length,
        source
      });

      return {
        success: finalSuccess,
        storedCount: totalStored,
        errors: allErrors
      };

    } catch (error) {
      console.error(`[ENHANCED_STORAGE] Exception during enhanced storage:`, error);
      return {
        success: false,
        storedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown storage error']
      };
    }
  }

  /**
   * Group transactions by month for optimal storage
   */
  private static groupTransactionsByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const year = txDate.getFullYear();
      const month = txDate.getMonth() + 1; // JavaScript months are 0-indexed
      const key = `${year}-${month}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(tx);
    });

    return groups;
  }

  /**
   * Preserve all transaction data during formatting
   */
  private static preserveTransactionData(transactions: Transaction[]): Transaction[] {
    return transactions.map((tx, index) => {
      // Preserve ALL original fields - no data loss
      const preservedTransaction = {
        // Core fields
        id: tx.id,
        external_id: tx.external_id || tx.id,
        date: tx.date,
        amount: tx.amount,
        description: tx.description || '',
        category: tx.category || '',
        type: tx.type,
        source: tx.source,
        
        // Financial fields (preserve null/undefined distinction)
        fees: tx.fees !== undefined ? tx.fees : null,
        gross: tx.gross !== undefined ? tx.gross : null,
        net: tx.net !== undefined ? tx.net : null,
        
        // Metadata and additional fields
        metadata: tx.metadata || {},
        
        // Preserve any additional fields that might exist
        ...Object.keys(tx).reduce((acc, key) => {
          if (!['id', 'external_id', 'date', 'amount', 'description', 'category', 'type', 'source', 'fees', 'gross', 'net', 'metadata'].includes(key)) {
            acc[key] = tx[key];
          }
          return acc;
        }, {} as any)
      };

      // Validate field preservation
      const preservation = dataIntegrityValidator.validateFieldPreservation(tx, preservedTransaction);
      if (!preservation.preserved) {
        console.warn(`[ENHANCED_STORAGE] Field preservation issue for transaction ${index}:`, preservation.missingFields);
      }

      console.log(`[ENHANCED_STORAGE] Preserved transaction ${index}:`, {
        id: preservedTransaction.id,
        amount: preservedTransaction.amount,
        date: preservedTransaction.date,
        hasGross: preservedTransaction.gross !== null,
        hasFees: preservedTransaction.fees !== null,
        fieldsCount: Object.keys(preservedTransaction).length
      });

      return preservedTransaction;
    });
  }
}

export const enhancedTransactionStorage = new EnhancedTransactionStorage();
