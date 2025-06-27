
export interface StoredFinancialSnapshot {
  id: string;
  timestamp: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: {
    transactions: any[];
    zohoTransactions: any[];
    stripeTransactions: any[];
    stripeData: any;
    summary: any;
    collaboratorExpenses: any[];
    unpaidInvoices: any[];
    startingBalance: number;
    regularIncome: number;
    stripeIncome: number;
    stripeFees: number;
    stripeNet: number;
    cacheStatus: any;
    apiConnectivity: any;
  };
  metadata: {
    dataSource: string;
    fetchDuration?: number;
    usingCachedData: boolean;
    version: string;
  };
}

export interface StoredDataSummary {
  totalSnapshots: number;
  latestSnapshot: string | null;
  storageSize: number;
  oldestSnapshot: string | null;
  availableDateRanges: Array<{
    start: string;
    end: string;
    timestamp: string;
  }>;
}

class FinancialDataStorageService {
  private readonly STORAGE_KEY = 'financial_data_snapshots';
  private readonly MAX_SNAPSHOTS = 10; // Keep last 10 snapshots
  private readonly CURRENT_VERSION = '1.0.0';

  /**
   * Save a comprehensive financial data snapshot
   */
  async saveSnapshot(
    dateRange: { startDate: Date; endDate: Date },
    financialData: any,
    metadata: {
      dataSource: string;
      fetchDuration?: number;
      usingCachedData: boolean;
    }
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
          version: this.CURRENT_VERSION,
        },
      };

      const existingSnapshots = this.getSnapshots();
      const updatedSnapshots = [snapshot, ...existingSnapshots]
        .slice(0, this.MAX_SNAPSHOTS); // Keep only the latest snapshots

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSnapshots));
      
      console.log('📁 Financial data snapshot saved:', {
        id: snapshot.id,
        dateRange: snapshot.dateRange,
        transactionCount: snapshot.data.transactions.length,
        storageSize: this.getStorageSize(),
      });
    } catch (error) {
      console.error('❌ Error saving financial snapshot:', error);
    }
  }

  /**
   * Get the most recent financial data snapshot
   */
  getLatestSnapshot(): StoredFinancialSnapshot | null {
    const snapshots = this.getSnapshots();
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  /**
   * Get snapshot for a specific date range
   */
  getSnapshotForDateRange(startDate: Date, endDate: Date): StoredFinancialSnapshot | null {
    const snapshots = this.getSnapshots();
    const targetStart = startDate.toISOString().split('T')[0];
    const targetEnd = endDate.toISOString().split('T')[0];

    return snapshots.find(snapshot => {
      const snapshotStart = new Date(snapshot.dateRange.startDate).toISOString().split('T')[0];
      const snapshotEnd = new Date(snapshot.dateRange.endDate).toISOString().split('T')[0];
      return snapshotStart === targetStart && snapshotEnd === targetEnd;
    }) || null;
  }

  /**
   * Get all stored snapshots
   */
  getSnapshots(): StoredFinancialSnapshot[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const snapshots = JSON.parse(stored) as StoredFinancialSnapshot[];
      return snapshots.filter(snapshot => snapshot.metadata.version === this.CURRENT_VERSION);
    } catch (error) {
      console.error('❌ Error loading financial snapshots:', error);
      return [];
    }
  }

  /**
   * Get storage summary information
   */
  getStorageSummary(): StoredDataSummary {
    const snapshots = this.getSnapshots();
    const storageSize = this.getStorageSize();

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

  /**
   * Clear all stored snapshots
   */
  clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Financial data storage cleared');
  }

  /**
   * Get the size of stored data in bytes
   */
  private getStorageSize(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? new Blob([stored]).size : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Format data for GPT context
   */
  formatForGPTContext(snapshot: StoredFinancialSnapshot): string {
    const data = snapshot.data;
    const dateRange = `${new Date(snapshot.dateRange.startDate).toLocaleDateString()} - ${new Date(snapshot.dateRange.endDate).toLocaleDateString()}`;
    
    return `
FINANCIAL DATA SNAPSHOT (${dateRange})
Captured: ${new Date(snapshot.timestamp).toLocaleString()}
Data Source: ${snapshot.metadata.dataSource}
Using Cached Data: ${snapshot.metadata.usingCachedData ? 'Yes' : 'No'}

SUMMARY:
- Total Income: $${data.summary?.totalIncome?.toLocaleString() || 0}
- Total Expenses: $${data.summary?.totalExpense?.toLocaleString() || 0}
- Profit: $${data.summary?.profit?.toLocaleString() || 0}
- Profit Margin: ${data.summary?.profitMargin?.toFixed(1) || 0}%
- Starting Balance: $${data.startingBalance?.toLocaleString() || 0}

INCOME BREAKDOWN:
- Stripe Income: $${data.stripeIncome?.toLocaleString() || 0}
- Stripe Fees: $${data.stripeFees?.toLocaleString() || 0}
- Stripe Net: $${data.stripeNet?.toLocaleString() || 0}
- Regular Income: $${data.regularIncome?.toLocaleString() || 0}

TRANSACTIONS:
- Total Transactions: ${data.transactions?.length || 0}
- Zoho Transactions: ${data.zohoTransactions?.length || 0}
- Stripe Transactions: ${data.stripeTransactions?.length || 0}
- Collaborator Expenses: ${data.collaboratorExpenses?.length || 0}
- Unpaid Invoices: ${data.unpaidInvoices?.length || 0}

RECENT TRANSACTIONS:
${data.transactions?.slice(0, 10).map((tx: any, index: number) => 
  `${index + 1}. ${tx.date} - ${tx.description} - $${tx.amount} (${tx.type})`
).join('\n') || 'No transaction data available'}
    `.trim();
  }
}

export const financialDataStorage = new FinancialDataStorageService();
