
import { useState, useRef, useEffect } from 'react';
import { FinancialData } from '@/types/financial';

/**
 * Hook to manage synchronizing the starting balance with financial data
 */
export function useBalanceSync() {
  // Reference to track if the balance has been synced to avoid infinite loops
  const balanceSyncedRef = useRef<number | null>(null);

  /**
   * Synchronize the starting balance with financial data
   * @param startingBalance The current starting balance
   * @param financialData The current financial data
   * @param setFinancialData Function to update financial data
   * @param dataInitialized Whether data has been initialized
   * @returns Whether the balance was synchronized
   */
  const syncBalance = (
    startingBalance: number | null | undefined,
    financialData: FinancialData | null,
    setFinancialData: (data: FinancialData) => void,
    dataInitialized: boolean
  ): boolean => {
    // Skip sync during component initialization or if data isn't loaded yet
    if (!dataInitialized || !financialData) {
      console.log('💡 Skipping balance sync - data not initialized or financial data not loaded yet');
      return false;
    }

    // Get the current financial data balance for comparison
    const currentFinancialDataBalance = financialData.summary.startingBalance;
    
    // Only proceed if we have both financialData and a valid startingBalance
    if (startingBalance !== undefined && startingBalance !== null) {
      // Check if the balance is different from what's in financialData AND from our last synced value
      const needsUpdate = (
        currentFinancialDataBalance === undefined || 
        currentFinancialDataBalance !== startingBalance
      ) && balanceSyncedRef.current !== startingBalance;
      
      if (needsUpdate) {
        console.log('📊 Updating financial data with starting balance:', startingBalance, 
                   'previous sync value was:', balanceSyncedRef.current);
        
        // Update our ref to indicate we've synced this specific balance value
        balanceSyncedRef.current = startingBalance;
        
        // Update the financial data with the new balance without triggering a full refresh
        setFinancialData({
          ...financialData,
          summary: {
            ...financialData.summary,
            startingBalance: startingBalance
          }
        });
        
        return true;
      } else {
        console.log('📊 No need to update financial data with starting balance - already synced or unchanged');
      }
    }
    
    return false;
  };

  return { syncBalance };
}
