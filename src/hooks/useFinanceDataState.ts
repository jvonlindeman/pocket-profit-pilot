
import { useState } from 'react';
import { FinancialData } from '@/types/financial';
import { emptyFinancialData } from '@/constants/financialDefaults';

/**
 * Hook to manage the state of financial data
 */
export const useFinanceDataState = () => {
  // Financial data state
  const [financialData, setFinancialData] = useState<FinancialData>(emptyFinancialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [regularIncome, setRegularIncome] = useState<number>(0);
  const [collaboratorExpenses, setCollaboratorExpenses] = useState<any[]>([]);

  return {
    financialData,
    setFinancialData,
    loading,
    setLoading,
    dataInitialized,
    setDataInitialized,
    rawResponse,
    setRawResponse,
    regularIncome,
    setRegularIncome,
    collaboratorExpenses,
    setCollaboratorExpenses
  };
};
