
import { Transaction } from "../../../types/financial";
import { CacheSource } from "../types";

/**
 * Data integrity validation for cache operations
 */
export class DataIntegrityValidator {
  /**
   * Validate transaction data before storage
   */
  static validateTransactionForStorage(transaction: Transaction, index: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required field validation
    if (!transaction.id) {
      errors.push(`Transaction ${index}: Missing ID`);
    }
    
    if (transaction.amount === undefined || transaction.amount === null) {
      errors.push(`Transaction ${index}: Missing amount`);
    }
    
    if (!transaction.date) {
      errors.push(`Transaction ${index}: Missing date`);
    }
    
    if (!transaction.type) {
      errors.push(`Transaction ${index}: Missing type`);
    }
    
    if (!transaction.source) {
      errors.push(`Transaction ${index}: Missing source`);
    }
    
    // Date format validation
    if (transaction.date && isNaN(new Date(transaction.date).getTime())) {
      errors.push(`Transaction ${index}: Invalid date format`);
    }
    
    // Amount validation
    if (typeof transaction.amount === 'string') {
      const numAmount = parseFloat(transaction.amount);
      if (isNaN(numAmount)) {
        errors.push(`Transaction ${index}: Invalid amount format`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a batch of transactions
   */
  static validateTransactionBatch(transactions: Transaction[]): { valid: Transaction[]; invalid: any[]; errors: string[] } {
    const valid: Transaction[] = [];
    const invalid: any[] = [];
    const allErrors: string[] = [];
    
    transactions.forEach((tx, index) => {
      const validation = this.validateTransactionForStorage(tx, index);
      
      if (validation.isValid) {
        valid.push(tx);
      } else {
        invalid.push({ transaction: tx, errors: validation.errors });
        allErrors.push(...validation.errors);
      }
    });
    
    return { valid, invalid, errors: allErrors };
  }
  
  /**
   * Compare API data with cached data for completeness
   */
  static compareDataCompleteness(
    apiData: Transaction[], 
    cachedData: Transaction[], 
    source: CacheSource
  ): { isComplete: boolean; missingCount: number; extraCount: number; report: string } {
    
    console.log(`🔍 DataIntegrityValidator: Comparing data completeness for ${source}`, {
      apiCount: apiData.length,
      cachedCount: cachedData.length
    });
    
    // Create sets of transaction IDs for comparison
    const apiIds = new Set(apiData.map(tx => tx.id || tx.external_id));
    const cachedIds = new Set(cachedData.map(tx => tx.id || tx.external_id));
    
    // Find missing and extra transactions
    const missingInCache = Array.from(apiIds).filter(id => !cachedIds.has(id));
    const extraInCache = Array.from(cachedIds).filter(id => !apiIds.has(id));
    
    const isComplete = missingInCache.length === 0 && extraInCache.length === 0;
    
    const report = `${source} Cache Completeness Report:
- API Transactions: ${apiData.length}
- Cached Transactions: ${cachedData.length}
- Missing in Cache: ${missingInCache.length}
- Extra in Cache: ${extraInCache.length}
- Is Complete: ${isComplete}`;
    
    console.log(report);
    
    return {
      isComplete,
      missingCount: missingInCache.length,
      extraCount: extraInCache.length,
      report
    };
  }
  
  /**
   * Validate that all essential transaction fields are preserved
   */
  static validateFieldPreservation(original: Transaction, stored: any): { preserved: boolean; missingFields: string[] } {
    const essentialFields = ['id', 'amount', 'date', 'type', 'source', 'description'];
    const missingFields: string[] = [];
    
    essentialFields.forEach(field => {
      if (original[field] !== undefined && stored[field] === undefined) {
        missingFields.push(field);
      }
    });
    
    // Check for Stripe-specific fields
    if (original.source === 'Stripe') {
      const stripeFields = ['fees', 'gross', 'net'];
      stripeFields.forEach(field => {
        if (original[field] !== undefined && stored[field] === undefined) {
          missingFields.push(field);
        }
      });
    }
    
    return {
      preserved: missingFields.length === 0,
      missingFields
    };
  }
}

export const dataIntegrityValidator = new DataIntegrityValidator();
