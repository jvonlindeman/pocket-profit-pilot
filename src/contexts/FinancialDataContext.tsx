import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { CategorySummary } from '@/types/financial';

export interface FinancialDataState {
  // Stripe data
  stripeFees: number;
  stripeFeePercentage: number;
  stripeIncome: number;
  stripeNet: number;
  
  // Zoho data
  totalZohoExpenses: number;
  collaboratorExpenses: CategorySummary[];
  regularIncome: number;
  
  // OPEX
  opexAmount: number;
  
  // Status
  isLoaded: boolean;
  lastUpdated: Date | null;
  
  // Actions
  setFinancialData: (data: Partial<Omit<FinancialDataState, 'setFinancialData' | 'isLoaded' | 'lastUpdated'>>) => void;
}

const defaultState: FinancialDataState = {
  stripeFees: 0,
  stripeFeePercentage: 4.43, // Default estimate
  stripeIncome: 0,
  stripeNet: 0,
  totalZohoExpenses: 0,
  collaboratorExpenses: [],
  regularIncome: 0,
  opexAmount: 0,
  isLoaded: false,
  lastUpdated: null,
  setFinancialData: () => {},
};

const FinancialDataContext = createContext<FinancialDataState>(defaultState);

interface FinancialDataProviderProps {
  children: ReactNode;
}

export const FinancialDataProvider: React.FC<FinancialDataProviderProps> = ({ children }) => {
  const [state, setState] = useState<Omit<FinancialDataState, 'setFinancialData' | 'isLoaded' | 'lastUpdated'>>({
    stripeFees: 0,
    stripeFeePercentage: 4.43,
    stripeIncome: 0,
    stripeNet: 0,
    totalZohoExpenses: 0,
    collaboratorExpenses: [],
    regularIncome: 0,
    opexAmount: 0,
  });

  const setFinancialData = useCallback((data: Partial<Omit<FinancialDataState, 'setFinancialData' | 'isLoaded' | 'lastUpdated'>>) => {
    setState(prev => ({ ...prev, ...data }));
  }, []);

  const value = useMemo<FinancialDataState>(() => ({
    ...state,
    isLoaded: state.stripeFees > 0 || state.totalZohoExpenses > 0 || state.opexAmount > 0,
    lastUpdated: state.stripeFees > 0 || state.totalZohoExpenses > 0 ? new Date() : null,
    setFinancialData,
  }), [state, setFinancialData]);

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useSharedFinancialData = () => {
  const context = useContext(FinancialDataContext);
  if (!context) {
    throw new Error('useSharedFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};

export default FinancialDataContext;
