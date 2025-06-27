
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

export interface SaveSnapshotMetadata {
  dataSource: string;
  fetchDuration?: number;
  usingCachedData: boolean;
}
