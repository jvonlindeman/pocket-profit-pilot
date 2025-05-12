
import { FinancialData, DateRange } from './financial';

// Simplified types for useFinanceData hook
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

// Types for error handling
export interface FinanceErrorHandler {
  error: string | null;
  setError: (error: string | null) => void;
  resetErrorState: () => void;
}

// Simple refresh status
export interface RefreshStatus {
  lastRefresh: Date;
  refreshAttempts: number;
}

// Simple finance data fetcher interface
export interface SimpleFinanceDataFetcher {
  financialData: FinancialData;
  loading: boolean;
  error: string | null;
  dataInitialized: boolean;
  rawResponse: any;
  regularIncome: number;
  collaboratorExpenses: any[];
  fetchFinancialData: (
    dateRange: DateRange, 
    stripeIncomeData: { amount: number, isOverridden: boolean },
    startingBalanceData?: { starting_balance: number }
  ) => Promise<FinancialData | null>;
  refreshStatus: RefreshStatus;
}
