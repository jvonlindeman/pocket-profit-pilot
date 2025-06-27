
import { useState, useCallback, useEffect } from 'react';
import { financialDataStorage, StoredFinancialSnapshot, StoredDataSummary } from '@/services/financialDataStorage';

export const useStoredFinancialData = () => {
  const [storageSummary, setStorageSummary] = useState<StoredDataSummary | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<StoredFinancialSnapshot | null>(null);

  // Load storage summary
  const loadStorageSummary = useCallback(() => {
    const summary = financialDataStorage.getStorageSummary();
    setStorageSummary(summary);
    
    const latest = financialDataStorage.getLatestSnapshot();
    setLatestSnapshot(latest);
  }, []);

  // Save financial data snapshot
  const saveSnapshot = useCallback(async (
    dateRange: { startDate: Date; endDate: Date },
    financialData: any,
    metadata: {
      dataSource: string;
      fetchDuration?: number;
      usingCachedData: boolean;
    }
  ) => {
    await financialDataStorage.saveSnapshot(dateRange, financialData, metadata);
    loadStorageSummary(); // Refresh summary after saving
  }, [loadStorageSummary]);

  // Get snapshot for specific date range
  const getSnapshotForDateRange = useCallback((startDate: Date, endDate: Date) => {
    return financialDataStorage.getSnapshotForDateRange(startDate, endDate);
  }, []);

  // Clear all stored data
  const clearStorage = useCallback(() => {
    financialDataStorage.clearStorage();
    loadStorageSummary();
  }, [loadStorageSummary]);

  // Format data for GPT
  const formatForGPT = useCallback((snapshot: StoredFinancialSnapshot) => {
    return financialDataStorage.formatForGPTContext(snapshot);
  }, []);

  // Load summary on mount
  useEffect(() => {
    loadStorageSummary();
  }, [loadStorageSummary]);

  return {
    storageSummary,
    latestSnapshot,
    saveSnapshot,
    getSnapshotForDateRange,
    clearStorage,
    formatForGPT,
    refreshSummary: loadStorageSummary,
  };
};
