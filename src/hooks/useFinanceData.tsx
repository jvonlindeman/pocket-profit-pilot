
import { useEffect, useCallback } from 'react';
import { useFinancialDateRange } from '@/hooks/useFinancialDateRange';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useTransactionData } from '@/hooks/useTransactionData';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';

/**
 * Hook principal que integra todos los hooks financieros
 */
export const useFinanceData = () => {
  // Gestión del rango de fechas
  const { dateRange, updateDateRange, getCurrentMonthRange } = useFinancialDateRange();

  // Gestión del balance mensual
  const currentMonthDate = dateRange.startDate || new Date();
  const { 
    monthlyBalance, 
    fetchMonthlyBalance, 
    updateMonthlyBalance,
    startingBalance, 
    setStartingBalance
  } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });

  // Procesamiento de ingresos y colaboradores
  const { 
    stripeIncome, stripeFees, 
    stripeTransactionFees, stripePayoutFees, stripeAdditionalFees,
    stripeNet, stripeFeePercentage, 
    regularIncome, processIncomeTypes 
  } = useIncomeProcessor();
  
  const { collaboratorExpenses, processCollaboratorData } = useCollaboratorProcessor();

  // Gestión de datos de transacciones
  const { 
    financialData,
    loading,
    error,
    rawResponse,
    refreshData: refreshTransactionData,
    dataInitialized,
    usingCachedData,
    cacheStatus
  } = useTransactionData(
    dateRange,
    startingBalance || 0,
    collaboratorExpenses
  );

  // When dateRange changes, make sure we fetch monthly balance
  useEffect(() => {
    fetchMonthlyBalance();
  }, [dateRange.startDate, fetchMonthlyBalance]);

  // Función pública para refrescar datos (forzando o no)
  const refreshData = useCallback((force = false) => {
    return refreshTransactionData(force, {
      onCollaboratorData: processCollaboratorData,
      onIncomeTypes: processIncomeTypes
    });
  }, [refreshTransactionData, processCollaboratorData, processIncomeTypes]);

  return {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData,
    dataInitialized,
    rawResponse,
    stripeIncome,
    stripeFees,
    stripeTransactionFees,
    stripePayoutFees,
    stripeAdditionalFees,
    stripeNet,
    stripeFeePercentage,
    regularIncome,
    collaboratorExpenses,
    startingBalance,
    updateStartingBalance: setStartingBalance,
    usingCachedData,
    cacheStatus
  };
};
