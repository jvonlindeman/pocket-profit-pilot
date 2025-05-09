
import { FinancialData, DateRange, CacheStats } from './financial';
import { CacheStatus } from './cache';

// Types for useFinanceDataState hook
export interface FinanceDataState {
  financialData: FinancialData;
  setFinancialData: (data: FinancialData) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  dataInitialized: boolean;
  setDataInitialized: (initialized: boolean) => void;
  rawResponse: any;
  setRawResponse: (response: any) => void;
  regularIncome: number;
  setRegularIncome: (income: number) => void;
  collaboratorExpenses: any[];
  setCollaboratorExpenses: (expenses: any[]) => void;
}

// Types for useFinanceErrorHandler hook
export interface FinanceErrorHandler {
  error: string | null;
  setError: (error: string | null) => void;
  resetErrorState: () => void;
  localRefreshingRef: React.MutableRefObject<boolean>;
}

// Types for useFianceDataFetcher return value
export interface FinanceDataFetcher {
  financialData: FinancialData;
  setFinancialData: (data: FinancialData) => void;
  loading: boolean;
  error: string | null;
  dataInitialized: boolean;
  setDataInitialized: (initialized: boolean) => void;
  rawResponse: any;
  regularIncome: number;
  collaboratorExpenses: any[];
  cacheStatus: CacheStatus;
  fetchFinancialData: (
    dateRange: DateRange, 
    stripeIncomeData: { amount: number, isOverridden: boolean },
    startingBalanceData?: { starting_balance: number },
    forceRefresh?: boolean
  ) => Promise<FinancialData | null>;
  clearCacheAndRefresh: (dateRange: DateRange) => Promise<boolean>;
  resetErrorState: () => void;
  isRefreshing: boolean;
}
