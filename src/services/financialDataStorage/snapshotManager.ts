
import { StoredFinancialSnapshot, SaveSnapshotMetadata, StoredDataSummary } from './types';
import { MAX_SNAPSHOTS, CURRENT_VERSION } from './constants';
import { StorageOperations } from './storageOperations';

export class SnapshotManager {
  /**
   * Save a comprehensive financial data snapshot
   */
  static async saveSnapshot(
    dateRange: { startDate: Date; endDate: Date },
    financialData: any,
    metadata: SaveSnapshotMetadata
  ): Promise<void> {
    try {
      const snapshot: StoredFinancialSnapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date().toISOString(),
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        data: {
          transactions: financialData.transactions || [],
          zohoTransactions: financialData.zohoTransactions || [],
          stripeTransactions: financialData.stripeTransactions || [],
          stripeData: financialData.stripeData,
          summary: financialData.summary,
          collaboratorExpenses: financialData.collaboratorExpenses || [],
          unpaidInvoices: financialData.unpaidInvoices || [],
          startingBalance: financialData.startingBalance || 0,
          regularIncome: financialData.regularIncome || 0,
          stripeIncome: financialData.stripeIncome || 0,
          stripeFees: financialData.stripeFees || 0,
          stripeNet: financialData.stripeNet || 0,
          cacheStatus: financialData.cacheStatus,
          apiConnectivity: financialData.apiConnectivity,
        },
        metadata: {
          ...metadata,
          version: CURRENT_VERSION,
        },
      };

      const existingSnapshots = StorageOperations.getSnapshots();
      const updatedSnapshots = [snapshot, ...existingSnapshots]
        .slice(0, MAX_SNAPSHOTS); // Keep only the latest snapshots

      StorageOperations.saveSnapshots(updatedSnapshots);
      
      console.log('📁 Financial data snapshot saved:', {
        id: snapshot.id,
        dateRange: snapshot.dateRange,
        transactionCount: snapshot.data.transactions.length,
        storageSize: StorageOperations.getStorageSize(),
      });
    } catch (error) {
      console.error('❌ Error saving financial snapshot:', error);
    }
  }

  /**
   * Get the most recent financial data snapshot
   */
  static getLatestSnapshot(): StoredFinancialSnapshot | null {
    const snapshots = StorageOperations.getSnapshots();
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  /**
   * Get snapshot for a specific date range
   */
  static getSnapshotForDateRange(startDate: Date, endDate: Date): StoredFinancialSnapshot | null {
    const snapshots = StorageOperations.getSnapshots();
    const targetStart = startDate.toISOString().split('T')[0];
    const targetEnd = endDate.toISOString().split('T')[0];

    return snapshots.find(snapshot => {
      const snapshotStart = new Date(snapshot.dateRange.startDate).toISOString().split('T')[0];
      const snapshotEnd = new Date(snapshot.dateRange.endDate).toISOString().split('T')[0];
      return snapshotStart === targetStart && snapshotEnd === targetEnd;
    }) || null;
  }

  /**
   * Get storage summary information
   */
  static getStorageSummary(): StoredDataSummary {
    const snapshots = StorageOperations.getSnapshots();
    const storageSize = StorageOperations.getStorageSize();

    return {
      totalSnapshots: snapshots.length,
      latestSnapshot: snapshots.length > 0 ? snapshots[0].timestamp : null,
      oldestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null,
      storageSize,
      availableDateRanges: snapshots.map(snapshot => ({
        start: snapshot.dateRange.startDate,
        end: snapshot.dateRange.endDate,
        timestamp: snapshot.timestamp,
      })),
    };
  }
}
