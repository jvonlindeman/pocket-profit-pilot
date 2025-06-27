
import { StoredFinancialSnapshot } from './types';
import { STORAGE_KEY, CURRENT_VERSION } from './constants';

export class StorageOperations {
  /**
   * Get all stored snapshots from localStorage
   */
  static getSnapshots(): StoredFinancialSnapshot[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const snapshots = JSON.parse(stored) as StoredFinancialSnapshot[];
      return snapshots.filter(snapshot => snapshot.metadata.version === CURRENT_VERSION);
    } catch (error) {
      console.error('❌ Error loading financial snapshots:', error);
      return [];
    }
  }

  /**
   * Save snapshots to localStorage
   */
  static saveSnapshots(snapshots: StoredFinancialSnapshot[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
    } catch (error) {
      console.error('❌ Error saving financial snapshots:', error);
      throw error;
    }
  }

  /**
   * Clear all stored snapshots
   */
  static clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Financial data storage cleared');
  }

  /**
   * Get the size of stored data in bytes
   */
  static getStorageSize(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Blob([stored]).size : 0;
    } catch {
      return 0;
    }
  }
}
