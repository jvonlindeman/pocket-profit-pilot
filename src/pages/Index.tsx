
import React, { useState, useEffect } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';
import { useToast } from '@/hooks/use-toast';
import { toFinancialDateRange, toDayPickerDateRange } from '@/utils/dateRangeAdapter';
import FinanceHeader from '@/components/Dashboard/FinanceHeader';
import FinanceWelcome from '@/components/Dashboard/FinanceWelcome';
import FinanceLoading from '@/components/Dashboard/FinanceLoading';
import FinanceError from '@/components/Dashboard/FinanceError';
import FinanceDashboard from '@/components/Dashboard/FinanceDashboard';
import DebugTools from '@/components/Dashboard/DebugTools';
import { DateRange } from 'react-day-picker';

const Index = () => {
  const {
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
    updateStartingBalance,
    usingCachedData,
    cacheStatus
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [calculatorRefreshKey, setCalculatorRefreshKey] = useState(0);
  
  // Convert financial date range to compatible format for useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  
  // Use the consolidated hook for monthly balance management
  const { 
    checkBalanceExists, 
    monthlyBalance, 
    fetchMonthlyBalance, 
    startingBalance 
  } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });
  
  const { toast } = useToast();

  // Format dates for titles with safety check
  const formatDateForTitle = (date: Date | undefined) => {
    if (!date) return 'Fecha inválida';
    
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date for title:", error);
      return 'Fecha inválida';
    }
  };

  // Title of the period with safety checks
  const periodTitle = dateRange.startDate && dateRange.endDate 
    ? `${formatDateForTitle(dateRange.startDate)} - ${formatDateForTitle(dateRange.endDate)}`
    : 'Periodo no seleccionado';

  // Handler for loading initial data
  const handleInitialLoad = async () => {
    // Check if we need to set the initial balance first
    const balanceExists = await checkBalanceExists();
    
    if (!balanceExists) {
      // Show dialog to set initial balance
      setShowBalanceDialog(true);
    } else {
      // Balance already exists, just load data
      toast({
        title: 'Cargando datos financieros',
        description: 'Obteniendo datos de Zoho Books y Stripe',
      });
      refreshData(true);
    }
  };

  // Handle balance saved in dialog - now triggers calculator refresh
  const handleBalanceSaved = () => {
    toast({
      title: 'Balance inicial guardado',
      description: 'Cargando datos financieros...',
    });
    refreshData(true);
    // Force calculator refresh
    setCalculatorRefreshKey(prev => prev + 1);
  };

  // Handler for balance changes in the MonthlyBalanceEditor - improved to trigger calculator refresh
  const handleBalanceChange = (balance: number) => {
    console.log("Balance changed in editor:", balance);
    // We need to make sure the UI reflects the new balance
    refreshData(false);
    // Force calculator refresh
    setCalculatorRefreshKey(prev => prev + 1);
  };

  // Handler for data refresh
  const handleRefresh = () => {
    console.log("Manual refresh requested");
    toast({
      title: 'Actualizando datos',
      description: 'Obteniendo datos más recientes...',
    });
    refreshData(true);
    // Force calculator refresh
    setCalculatorRefreshKey(prev => prev + 1);
  };

  // Adapter function to convert between date range formats
  const handleDateRangeChange = (newRange: DateRange) => {
    if (newRange.from && newRange.to) {
      updateDateRange(toFinancialDateRange(newRange));
    }
  };

  // Map the current month range function to match DateRangePicker's expected format
  const getDatePickerCurrentMonthRange = () => {
    const financialDateRange = getCurrentMonthRange();
    return toDayPickerDateRange(financialDateRange);
  };

  // Ensure we fetch the monthly balance when date range changes
  useEffect(() => {
    if (currentMonthDate) {
      fetchMonthlyBalance();
    }
  }, [currentMonthDate, fetchMonthlyBalance]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dialog to set initial balance */}
      <InitialBalanceDialog 
        open={showBalanceDialog} 
        onOpenChange={setShowBalanceDialog} 
        currentDate={currentMonthDate}
        onBalanceSaved={handleBalanceSaved}
      />
      
      {/* Header section */}
      <FinanceHeader
        dateRange={toDayPickerDateRange(dateRange)}
        onRangeChange={handleDateRangeChange}
        getCurrentMonthRange={getDatePickerCurrentMonthRange}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!dataInitialized && (
          <FinanceWelcome onLoadData={handleInitialLoad} />
        )}
        
        {loading && <FinanceLoading />}
        
        {error && (
          <FinanceError error={error} onRetry={handleRefresh} />
        )}
        
        {dataInitialized && !loading && !error && (
          <FinanceDashboard
            periodTitle={periodTitle}
            financialData={financialData}
            dateRange={dateRange}
            cacheStatus={cacheStatus}
            usingCachedData={usingCachedData}
            stripeIncome={stripeIncome}
            stripeFees={stripeFees}
            stripeTransactionFees={stripeTransactionFees}
            stripePayoutFees={stripePayoutFees}
            stripeAdditionalFees={stripeAdditionalFees}
            stripeNet={stripeNet}
            stripeFeePercentage={stripeFeePercentage}
            regularIncome={regularIncome}
            startingBalance={startingBalance || 0}
            monthlyBalance={monthlyBalance}
            calculatorRefreshKey={calculatorRefreshKey}
            onRefresh={handleRefresh}
            onBalanceChange={handleBalanceChange}
            currentMonthDate={currentMonthDate}
          />
        )}

        {/* Sección de depuración */}
        <DebugTools
          dateRange={dateRange}
          refreshData={refreshData}
          rawResponse={rawResponse}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-500">
            Analizador Financiero para Agencias v1.0 • Datos obtenidos de Zoho Books y Stripe
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
