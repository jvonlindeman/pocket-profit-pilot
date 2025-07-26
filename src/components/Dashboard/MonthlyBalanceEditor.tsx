
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PencilIcon, RefreshCw, Wallet } from 'lucide-react';
import InitialBalanceDialog from './InitialBalanceDialog';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface MonthlyBalanceEditorProps {
  currentDate: Date;
  onBalanceChange: (
    balance: number, 
    opexAmount?: number, 
    itbmAmount?: number, 
    profitPercentage?: number, 
    taxReservePercentage?: number, 
    stripeSavingsPercentage?: number,
    includeZohoFiftyPercent?: boolean
  ) => Promise<boolean>;
}

const MonthlyBalanceEditor: React.FC<MonthlyBalanceEditorProps> = ({ 
  currentDate,
  onBalanceChange
}) => {
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const { 
    loading, 
    monthlyBalance, 
    fetchMonthlyBalance,
    updateMonthlyBalance,
    error
  } = useMonthlyBalance({ currentDate });
  const isMobile = useIsMobile();

  // Debug what monthlyBalance we have
  useEffect(() => {
    console.log("🔍 EDITOR: monthlyBalance changed:", {
      monthlyBalance,
      hasBalance: !!monthlyBalance,
      values: monthlyBalance ? {
        balance: monthlyBalance.balance,
        opex_amount: monthlyBalance.opex_amount,
        itbm_amount: monthlyBalance.itbm_amount,
        profit_percentage: monthlyBalance.profit_percentage,
        tax_reserve_percentage: monthlyBalance.tax_reserve_percentage,
        include_zoho_fifty_percent: monthlyBalance.include_zoho_fifty_percent
      } : null
    });
  }, [monthlyBalance]);

  // Ensure we have the latest balance when currentDate changes
  useEffect(() => {
    if (currentDate) {
      console.log("🔍 EDITOR: currentDate changed, fetching balance");
      fetchMonthlyBalance();
    }
  }, [currentDate, fetchMonthlyBalance]);

  // Handle opening the dialog - refresh data first
  const handleOpenDialog = async () => {
    console.log("🔍 EDITOR: Opening dialog, refreshing data first");
    // Always fetch fresh data before opening the dialog
    await fetchMonthlyBalance();
    setShowBalanceDialog(true);
  };

  // Safe formatting of month name in Spanish
  const formattedMonth = (() => {
    try {
      if (currentDate && !isNaN(currentDate.getTime())) {
        return format(currentDate, 'MMMM yyyy', { locale: es });
      }
      return format(new Date(), 'MMMM yyyy', { locale: es });
    } catch (err) {
      console.error("Error formatting month:", err);
      return format(new Date(), 'MMMM yyyy', { locale: es });
    }
  })();
  
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // Handle the save event from the dialog - IMMEDIATE UPDATE
  const handleBalanceSaved = async (
    balance: number, 
    opexAmount: number = 35,
    itbmAmount: number = 0,
    profitPercentage: number = 1,
    taxReservePercentage: number = 5,
    stripeSavingsPercentage: number = 0,
    includeZohoFiftyPercent: boolean = true,
    notes?: string
  ): Promise<boolean> => {
    console.log("🔍 EDITOR: Balance saved - TRIGGERING IMMEDIATE UPDATE:", {
      balance, opexAmount, itbmAmount, profitPercentage, taxReservePercentage, includeZohoFiftyPercent, notes,
      timestamp: new Date().toISOString()
    });
    
    try {
      // IMMEDIATE: Trigger the parent's immediate update handler
      await onBalanceChange(balance, opexAmount, itbmAmount, profitPercentage, taxReservePercentage, stripeSavingsPercentage, includeZohoFiftyPercent);
      
      // Close dialog only on success
      setShowBalanceDialog(false);
      
      // Fetch fresh data after save to ensure we have the latest values
      setTimeout(() => {
        console.log("🔍 EDITOR: Fetching fresh data after save");
        fetchMonthlyBalance();
      }, 500);
      
      return true;
    } catch (error) {
      console.error("🔍 EDITOR: Error saving balance:", error);
      return false;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center space-x-3 mb-3 sm:mb-0">
        <div className="bg-blue-100 p-2 rounded-full">
          <Wallet className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">Balance Inicial para {capitalizedMonth}</h3>
          <p className="text-sm text-gray-500">
            {monthlyBalance ? 
              `$${monthlyBalance.balance.toFixed(2)}` : 
              "No establecido"}
          </p>
          {monthlyBalance && (
            <div className="space-y-0.5 text-xs">
              <p className="text-xs text-gray-400 truncate">
                {isMobile ? (
                  <>
                    ITBM: ${monthlyBalance.itbm_amount?.toFixed(2) || "0.00"}<br />
                    OPEX: ${monthlyBalance.opex_amount?.toFixed(2) || "0.00"}<br />
                    Profit: {monthlyBalance.profit_percentage?.toFixed(1) || "0.0"}%<br />
                    Tax Reserve: {monthlyBalance.tax_reserve_percentage?.toFixed(1) || "5.0"}%<br />
                    50% Zoho: {monthlyBalance.include_zoho_fifty_percent ? "Sí" : "No"}
                  </>
                ) : (
                  <>
                    ITBM: ${monthlyBalance.itbm_amount?.toFixed(2) || "0.00"} | 
                    OPEX: ${monthlyBalance.opex_amount?.toFixed(2) || "0.00"} | 
                    Profit: {monthlyBalance.profit_percentage?.toFixed(1) || "0.0"}% | 
                    Tax Reserve: {monthlyBalance.tax_reserve_percentage?.toFixed(1) || "5.0"}% | 
                    50% Zoho: {monthlyBalance.include_zoho_fifty_percent ? "Sí" : "No"}
                  </>
                )}
              </p>
              {monthlyBalance.notes && (
                <p className="text-xs text-gray-500 italic max-w-[280px] sm:max-w-full truncate">
                  "{monthlyBalance.notes}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("🔍 EDITOR: Manual refresh requested");
            fetchMonthlyBalance();
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          disabled={loading}
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          {monthlyBalance ? "Editar" : "Configurar"} 
        </Button>
      </div>
      
      <InitialBalanceDialog
        open={showBalanceDialog}
        onOpenChange={setShowBalanceDialog}
        currentDate={currentDate}
        onBalanceSaved={handleBalanceSaved}
        currentBalance={monthlyBalance}
      />
    </div>
  );
};

export default MonthlyBalanceEditor;
