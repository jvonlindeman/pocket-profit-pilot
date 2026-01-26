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
    taxReservePercentage?: number,
    stripeSavingsPercentage?: number,
    includeZohoFiftyPercent?: boolean,
    notes?: string
  ) => Promise<boolean>;
  setStartingBalance: (balance: number) => void;
  isRefreshing?: boolean;
}

export const useDashboardDataHandlers = ({
  checkBalanceExists,
  setShowBalanceDialog,
  refreshData,
  updateMonthlyBalance,
  setStartingBalance,
  isRefreshing = false,
}: DashboardDataHandlersProps) => {
  const { toast } = useToast();

  // Handler for manual data loading - triggered by user action only
  const handleInitialLoad = useCallback(async () => {
    console.log("🚀 DashboardDataHandlers: Manual data load requested by user");
    
    // Check if we need to set the initial balance first
    const balanceExists = await checkBalanceExists();
    
    if (!balanceExists) {
      // Show dialog to set initial balance
      setShowBalanceDialog(true);
    } else {
      // Balance exists, trigger manual data load
      toast({
        title: 'Cargando datos financieros',
        description: 'Obteniendo datos desde las APIs...',
      });
      refreshData(false);
    }
  }, [checkBalanceExists, setShowBalanceDialog, toast, refreshData]);

  // Handle balance saved in dialog
  const handleBalanceSaved = useCallback(async (
    balance: number,
    opexAmount: number = 35,
    itbmAmount: number = 0,
    profitPercentage: number = 1,
    taxReservePercentage: number = 5,
    stripeSavingsPercentage: number = 0,
    includeZohoFiftyPercent: boolean = true,
    notes?: string
  ) => {
    console.log("💾 DashboardDataHandlers: handleBalanceSaved CALLED WITH VALUES:", {
      balance, opexAmount, itbmAmount, profitPercentage, taxReservePercentage, includeZohoFiftyPercent, notes
    });
    
    try {
      // Immediate state propagation - update starting balance first
      setStartingBalance(balance);
      
      // Save to database
      const success = await updateMonthlyBalance(
        balance,
        opexAmount,
        itbmAmount,
        profitPercentage,
        taxReservePercentage,
        stripeSavingsPercentage,
        includeZohoFiftyPercent,
        notes
      );

      if (success) {
        toast({
          title: 'Balance inicial guardado',
          description: 'Configuración actualizada exitosamente',
        });
        
        // Small delay before refresh to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Background refresh with fresh API calls
        console.log("💾 DashboardDataHandlers: Starting API refresh");
        refreshData(true);
        return true;
      } else {
        throw new Error("Failed to save balance");
      }
    } catch (error) {
      console.error("💾 DashboardDataHandlers: ERROR saving balance:", error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
      return false;
    }
  }, [updateMonthlyBalance, setStartingBalance, toast, refreshData]);

  // Handler for balance changes
  const handleBalanceChange = useCallback(async (
    balance: number, 
    opexAmount: number = 35, 
    itbmAmount: number = 0, 
    profitPercentage: number = 1,
    taxReservePercentage: number = 5,
    stripeSavingsPercentage: number = 0,
    includeZohoFiftyPercent: boolean = true
  ): Promise<boolean> => {
    console.log("💰 DashboardDataHandlers: handleBalanceChange CALLED:", {
      balance, opexAmount, itbmAmount, profitPercentage, taxReservePercentage, includeZohoFiftyPercent
    });
    
    try {
      const success = await updateMonthlyBalance(
        balance, 
        opexAmount,
        itbmAmount,
        profitPercentage,
        taxReservePercentage,
        stripeSavingsPercentage,
        includeZohoFiftyPercent
      );

      if (success) {
        setStartingBalance(balance);
        
        toast({
          title: 'Balance actualizado',
          description: `Profit: ${profitPercentage}%, Tax: ${taxReservePercentage}%`,
        });

        refreshData(true);
        return true;
      } else {
        throw new Error("Failed to update monthly balance");
      }
    } catch (error) {
      console.error("💰 DashboardDataHandlers: ERROR in handleBalanceChange:", error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el balance',
        variant: 'destructive',
      });
      return false;
    }
  }, [updateMonthlyBalance, setStartingBalance, toast, refreshData]);

  // Handler for data refresh
  const handleRefresh = useCallback(() => {
    console.log("🔄 DashboardDataHandlers: Manual refresh requested - user action");
    
    if (isRefreshing) {
      toast({
        title: 'Actualización en progreso',
        description: 'Los datos se están actualizando...',
      });
    } else {
      toast({
        title: 'Actualizando datos',
        description: 'Obteniendo datos más recientes desde las APIs...',
      });
    }
    
    refreshData(true);
  }, [toast, refreshData, isRefreshing]);

  return {
    handleInitialLoad,
    handleBalanceSaved,
    handleBalanceChange,
    handleRefresh,
  };
};
