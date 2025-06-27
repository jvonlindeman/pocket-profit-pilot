
import { SaveSnapshotMetadata, StoredFinancialSnapshot, StoredDataSummary } from './types';
import { SnapshotManager } from './snapshotManager';
import { StorageOperations } from './storageOperations';
import { GPTFormatter } from './gptFormatter';

class FinancialDataStorageService {
  /**
   * Save a comprehensive financial data snapshot
   */
  async saveSnapshot(
    dateRange: { startDate: Date; endDate: Date },
    financialData: any,
    metadata: SaveSnapshotMetadata
  ): Promise<void> {
    return SnapshotManager.saveSnapshot(dateRange, financialData, metadata);
  }

  /**
   * Get the most recent financial data snapshot
   */
  getLatestSnapshot(): StoredFinancialSnapshot | null {
    return SnapshotManager.getLatestSnapshot();
  }

  /**
   * Get snapshot for a specific date range
   */
  getSnapshotForDateRange(startDate: Date, endDate: Date): StoredFinancialSnapshot | null {
    return SnapshotManager.getSnapshotForDateRange(startDate, endDate);
  }

  /**
   * Get all stored snapshots
   */
  getSnapshots(): StoredFinancialSnapshot[] {
    return StorageOperations.getSnapshots();
  }

  /**
   * Get storage summary information
   */
  getStorageSummary(): StoredDataSummary {
    return SnapshotManager.getStorageSummary();
  }

  /**
   * Clear all stored snapshots
   */
  clearStorage(): void {
    StorageOperations.clearStorage();
  }

  /**
   * Format data for GPT context
   */
  formatForGPTContext(snapshot: StoredFinancialSnapshot): string {
    return GPTFormatter.formatForGPTContext(snapshot);
  }
}

export const financialDataStorage = new FinancialDataStorageService();

// Re-export types for convenience
export * from './types';
