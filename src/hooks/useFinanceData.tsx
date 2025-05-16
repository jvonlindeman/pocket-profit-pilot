
import { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useFinancialDataFetcher } from '@/hooks/useFinancialDataFetcher';
import { useCollaboratorProcessor } from '@/hooks/useCollaboratorProcessor';
import { useIncomeProcessor } from '@/hooks/useIncomeProcessor';
import { useMonthlyBalanceManager } from '@/hooks/useMonthlyBalanceManager';
import { financialService } from '@/services/financialService';
import { zohoRepository } from '@/repositories/zohoRepository';
import { formatDateYYYYMMDD, getCurrentMonthRange } from '@/utils/dateUtils';
import { Transaction } from '@/types/financial';
import { toast } from "@/hooks/use-toast";
import CacheService from '@/services/cache';

export const useFinanceData = () => {
  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  
  // Estado del rango de fechas - configurado para mostrar el mes actual (desde el primer día hasta el último día)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Primer día del mes actual
    const startDate = startOfMonth(today);
    // Último día del mes actual
    const endDate = endOfMonth(today);
    console.log("Initial date range:", startDate, "to", endDate);
    return { startDate, endDate };
  });

  // Import functionality from smaller hooks
  const { startingBalance, fetchMonthlyBalance, updateStartingBalance, setStartingBalance } = useMonthlyBalanceManager();
  const { 
    stripeIncome, stripeFees, 
    stripeTransactionFees, stripePayoutFees, stripeAdditionalFees,
    stripeNet, stripeFeePercentage, 
    regularIncome, processIncomeTypes 
  } = useIncomeProcessor();
  const { collaboratorExpenses, processCollaboratorData } = useCollaboratorProcessor();
  const { 
    loading, 
    error, 
    rawResponse, 
    usingCachedData, 
    fetchFinancialData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity
  } = useFinancialDataFetcher();

  // Datos financieros procesados
  const financialData = useMemo(() => {
    // Make sure to pass collaboratorExpenses to ensure they're included in the summary
    return financialService.processTransactionData(transactions, startingBalance, collaboratorExpenses);
  }, [transactions, startingBalance, collaboratorExpenses]);

  // Helper function to get cache segment ID for the current data
  const getCacheSegmentIds = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      console.log("Cannot get cache segment IDs without date range");
      return { zoho: null, stripe: null };
    }

    try {
      // Try to get the cache segment ID for Zoho
      const zohoSegmentId = await CacheService.getCacheSegmentId(
        'Zoho',
        dateRange.startDate,
        dateRange.endDate
      );
      
      // Try to get the cache segment ID for Stripe
      const stripeSegmentId = await CacheService.getCacheSegmentId(
        'Stripe',
        dateRange.startDate,
        dateRange.endDate
      );
      
      console.log(`Retrieved cache segment IDs - Zoho: ${zohoSegmentId || 'none'}, Stripe: ${stripeSegmentId || 'none'}`);
      return { zoho: zohoSegmentId, stripe: stripeSegmentId };
    } catch (err) {
      console.error("Error retrieving cache segment IDs:", err);
      return { zoho: null, stripe: null };
    }
  }, [dateRange]);

  // Save financial summary to database when data is processed
  useEffect(() => {
    // Only save when we have actual financial data and valid date range
    if (financialData && financialData.summary && dateRange.startDate && dateRange.endDate && transactions.length > 0 && !loading) {
      console.log("Saving financial data to database:", { 
        financialData,
        dateRange
      });
      
      // Get the cache segment ID before saving the financial summary
      getCacheSegmentIds().then(({ zoho, stripe }) => {
        // Use the appropriate cache segment ID based on data sources
        // Prefer Zoho if available, otherwise use Stripe if available
        const cacheSegmentId = zoho || stripe || null;
        
        console.log("Using cache segment ID for saving financial summary:", cacheSegmentId);
        
        financialService.saveFinancialSummary(financialData, dateRange, cacheSegmentId)
          .then(summaryId => {
            if (summaryId) {
              console.log("Financial summary saved with ID:", summaryId);
            } else {
              console.warn("Failed to save financial summary");
            }
          })
          .catch(err => {
            console.error("Error saving financial summary:", err);
          });
      });
    }
  }, [financialData, dateRange, transactions.length, loading, getCacheSegmentIds]);

  // Función para actualizar el rango de fechas
  const updateDateRange = useCallback((newRange: { startDate: Date; endDate: Date }) => {
    console.log("Date range updated:", newRange);
    
    // Create shallow copies to preserve the exact selected dates
    const preservedStartDate = new Date(newRange.startDate);
    const preservedEndDate = new Date(newRange.endDate);
    
    setDateRange({
      startDate: preservedStartDate,
      endDate: preservedEndDate
    });

    // Fetch monthly balance when date range changes
    fetchMonthlyBalance(preservedStartDate);
    
    // Check if we need to refresh the cache
    zohoRepository.checkAndRefreshCache(preservedStartDate, preservedEndDate);
  }, [fetchMonthlyBalance]);

  // When dateRange changes, make sure we fetch monthly balance
  useEffect(() => {
    fetchMonthlyBalance(dateRange.startDate);
  }, [dateRange.startDate, fetchMonthlyBalance]);

  // Función para cargar los datos 
  const fetchData = useCallback(async (forceRefresh = false) => {
    const success = await fetchFinancialData(
      dateRange,
      forceRefresh,
      {
        onTransactions: (combinedData) => {
          setTransactions(combinedData);
          setDataInitialized(true);
        },
        onCollaboratorData: processCollaboratorData,
        onIncomeTypes: processIncomeTypes
      }
    );
    
    if (success && transactions.length > 0) {
      toast({
        title: "Datos financieros actualizados",
        description: `Se procesaron ${transactions.length} transacciones`
      });
    }
    
    return success;
  }, [
    dateRange, 
    fetchFinancialData, 
    processCollaboratorData, 
    processIncomeTypes,
    transactions.length
  ]);
  
  // Función pública para refrescar datos (forzando o no)
  const refreshData = useCallback((force = false) => {
    fetchData(force);
  }, [fetchData]);

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
    updateStartingBalance,
    setStartingBalance, 
    usingCachedData,
    cacheStatus,
    apiConnectivity,
    checkApiConnectivity
  };
};
