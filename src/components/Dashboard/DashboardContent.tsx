import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import NoDataLoadedState from './NoDataLoadedState';
import FinanceSummary from './FinanceSummary';
import TransactionTable from './TransactionTable';
import FinancialCards from './FinancialCards';
import SalaryCalculator from './SalaryCalculator';
import { ReceivablesManager } from './Receivables/ReceivablesManager';
import InitialBalanceDialog from './InitialBalanceDialog';
import MonthlyBalanceEditor from './MonthlyBalanceEditor';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardContentProps {
  onRefresh?: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ onRefresh }) => {
  const [showInitialBalanceDialog, setShowInitialBalanceDialog] = useState(false);
  const [showMonthlyBalanceDialog, setShowMonthlyBalanceDialog] = useState(false);
  
  const {
    financialData,
    loading,
    error,
    refreshData,
    dataInitialized,
    stripeIncome,
    stripeFees,
    stripeNet,
    regularIncome,
    collaboratorExpenses,
    unpaidInvoices,
    startingBalance,
    notes,
    setNotes,
    usingCachedData,
    cacheStatus,
    isRefreshing
  } = useFinanceData();

  // OPEX and ITBM configuration with defaults
  const defaultOpexAmount = 2650;
  const defaultItbmAmount = 1070; 
  const defaultProfitPercentage = 25;
  const defaultTaxReservePercentage = 20;
  const defaultIncludeZohoFiftyPercent = true;

  const handleRefresh = async () => {
    try {
      console.log("🔄 Dashboard: Manual refresh initiated by user");
      const success = await refreshData(true);
      
      if (success) {
        toast.success("Datos actualizados exitosamente");
        onRefresh?.();
      } else {
        toast.warning("No se pudo actualizar - intenta de nuevo");
      }
    } catch (error) {
      console.error("Dashboard refresh error:", error);
      toast.error("Error al actualizar los datos");
    }
  };

  const handleConfigureBalances = () => {
    setShowMonthlyBalanceDialog(true);
  };

  // Calculate total Zoho expenses for the calculator
  const totalZohoExpenses = useMemo(() => {
    const totalExpense = financialData.summary.totalExpense || 0;
    const collabExpense = typeof collaboratorExpenses === 'number' ? collaboratorExpenses : 0;
    return totalExpense - collabExpense;
  }, [financialData.summary.totalExpense, collaboratorExpenses]);

  if (error && !dataInitialized) {
    return <ErrorDisplay error={error} onRetry={handleRefresh} />;
  }

  if (!dataInitialized) {
    return (
      <NoDataLoadedState 
        onLoadCache={handleRefresh}
        onLoadFresh={handleRefresh}
        hasCachedData={!!usingCachedData}
        isLoading={loading}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            {(loading || isRefreshing) ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button 
            onClick={handleConfigureBalances}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="salary">Salario</TabsTrigger>
          <TabsTrigger value="receivables">Por Cobrar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinancialCards />
          <FinanceSummary 
            summary={financialData.summary}
            expenseCategories={financialData.expenseByCategory}
            stripeIncome={stripeNet}
            stripeFees={stripeFees}
            regularIncome={regularIncome}
            dateRange={{ startDate: new Date(), endDate: new Date() }}
            transactions={financialData.transactions}
            unpaidInvoices={unpaidInvoices}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionTable 
            transactions={financialData.transactions}
            isLoading={loading}
          />
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          <SalaryCalculator
            zohoIncome={regularIncome}
            stripeIncome={stripeNet} // FIXED: Now using stripeNet instead of stripeIncome (gross)
            opexAmount={defaultOpexAmount}
            itbmAmount={defaultItbmAmount}
            profitPercentage={defaultProfitPercentage}
            taxReservePercentage={defaultTaxReservePercentage}
            includeZohoFiftyPercent={defaultIncludeZohoFiftyPercent}
            startingBalance={startingBalance}
            totalZohoExpenses={totalZohoExpenses}
            onConfigureClick={handleConfigureBalances}
          />
        </TabsContent>

        <TabsContent value="receivables" className="space-y-6">
          <ReceivablesManager 
            stripeNet={stripeNet}
            adjustedZohoIncome={regularIncome}
          />
        </TabsContent>
      </Tabs>

      <InitialBalanceDialog
        open={showInitialBalanceDialog}
        onOpenChange={setShowInitialBalanceDialog}
        currentDate={new Date()}
        onBalanceSaved={async () => true}
      />

      <MonthlyBalanceEditor
        currentDate={new Date()}
        onBalanceChange={async () => true}
      />
    </div>
  );
};

export default DashboardContent;
