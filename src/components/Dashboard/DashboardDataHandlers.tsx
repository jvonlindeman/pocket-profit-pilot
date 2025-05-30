
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DashboardDataHandlersProps {
  checkBalanceExists: () => Promise<boolean>;
  setShowBalanceDialog: (show: boolean) => void;
  refreshData: (force: boolean) => Promise<any>;
  updateMonthlyBalance: (
    balance: number,
    opexAmount?: number,
    itbmAmount?: number,
    profitPercentage?: number,
    taxReservePercentage?: number
  ) => Promise<boolean>;
  setStartingBalance: (balance: number) => void;
  hasCachedData: boolean;
  isRefreshing?: boolean;
}

export const useDashboardDataHandlers = ({
  checkBalanceExists,
  setShowBalanceDialog,
  refreshData,
  updateMonthlyBalance,
  setStartingBalance,
  hasCachedData,
  isRefreshing = false,
}: DashboardDataHandlersProps) => {
  const { toast } = useToast();

  // Handler for manual data loading - triggered by user action only
  const handleInitialLoad = useCallback(async () => {
    console.log("🚀 DashboardDataHandlers: Manual data load requested by user", {
      hasCachedData
    });
    
    // Check if we need to set the initial balance first
    const balanceExists = await checkBalanceExists();
    
    if (!balanceExists) {
      // Show dialog to set initial balance
      setShowBalanceDialog(true);
    } else {
      // Balance exists, trigger manual data load
      toast({
        title: 'Cargando datos financieros',
        description: hasCachedData ? 'Cargando desde caché local' : 'Obteniendo desde APIs',
      });
      refreshData(false); // Manual load, use cache-first approach
    }
  }, [checkBalanceExists, setShowBalanceDialog, toast, hasCachedData, refreshData]);

  // Handle balance saved in dialog
  const handleBalanceSaved = useCallback(() => {
    toast({
      title: 'Balance inicial guardado',
      description: 'Cargando datos financieros...',
    });
    refreshData(false); // Manual load after balance is set
  }, [toast, refreshData]);

  // Updated handler for balance changes - now with immediate updates and comprehensive logging
  const handleBalanceChange = useCallback(async (
    balance: number, 
    opexAmount: number = 35, 
    itbmAmount: number = 0, 
    profitPercentage: number = 1,
    taxReservePercentage: number = 5
  ) => {
    console.log("💰 DashboardDataHandlers: handleBalanceChange CALLED WITH PARAMETERS:", {
      balance: { value: balance, type: typeof balance },
      opexAmount: { value: opexAmount, type: typeof opexAmount },
      itbmAmount: { value: itbmAmount, type: typeof itbmAmount },
      profitPercentage: { value: profitPercentage, type: typeof profitPercentage, isZero: profitPercentage === 0 },
      taxReservePercentage: { value: taxReservePercentage, type: typeof taxReservePercentage, isZero: taxReservePercentage === 0 },
      timestamp: new Date().toISOString()
    });
    
    try {
      // 1. IMMEDIATE: Update the monthly balance with optimistic update
      console.log("💰 DashboardDataHandlers: Calling updateMonthlyBalance with parameters:", {
        balance,
        opexAmount,
        itbmAmount,
        profitPercentage,
        taxReservePercentage
      });
      
      const success = await updateMonthlyBalance(
        balance, 
        opexAmount,
        itbmAmount,
        profitPercentage,
        taxReservePercentage
      );

      if (success) {
        // 2. IMMEDIATE: Update local starting balance for immediate UI feedback
        console.log("💰 DashboardDataHandlers: updateMonthlyBalance SUCCESS - Updating local starting balance to:", balance);
        setStartingBalance(balance);
        
        // 3. Show immediate feedback
        toast({
          title: 'Balance actualizado inmediatamente',
          description: 'Los cálculos se han actualizado',
        });

        // 4. BACKGROUND: Update backend data (no loading state)
        console.log("💰 DashboardDataHandlers: Triggering background data refresh");
        refreshData(false);
      } else {
        console.error("💰 DashboardDataHandlers: updateMonthlyBalance FAILED");
        throw new Error("Failed to update monthly balance");
      }
    } catch (error) {
      console.error("💰 DashboardDataHandlers: ERROR in handleBalanceChange:", error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el balance',
        variant: 'destructive',
      });
    }
  }, [updateMonthlyBalance, setStartingBalance, toast, refreshData]);

  // Enhanced handler for data refresh with smart refresh feedback
  const handleRefresh = useCallback(() => {
    console.log("🔄 DashboardDataHandlers: Manual refresh requested - user action");
    
    if (isRefreshing) {
      toast({
        title: 'Actualización en progreso',
        description: 'Los datos se están actualizando en segundo plano...',
      });
    } else {
      toast({
        title: 'Actualizando datos',
        description: 'Obteniendo datos más recientes desde las APIs...',
      });
    }
    
    refreshData(true); // Force refresh for manual user action
  }, [toast, refreshData, isRefreshing]);

  return {
    handleInitialLoad,
    handleBalanceSaved,
    handleBalanceChange,
    handleRefresh,
  };
};
