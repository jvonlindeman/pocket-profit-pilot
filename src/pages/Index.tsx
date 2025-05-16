
import React, { useState } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import { toDayPickerDateRange, toFinancialDateRange } from '@/utils/dateRangeAdapter';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

// Component imports
import DashboardHeader from '@/components/Dashboard/Header/DashboardHeader';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';
import InitialLoadPrompt from '@/components/Dashboard/InitialLoadPrompt';
import LoadingSpinner from '@/components/Dashboard/LoadingSpinner';
import ErrorDisplay from '@/components/Dashboard/ErrorDisplay';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';
import Footer from '@/components/Dashboard/Footer';

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
    startingBalance,
    updateStartingBalance,
    usingCachedData,
    cacheStatus
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  
  // Convert financial date range to compatible format for useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  
  const { checkBalanceExists, monthlyBalance } = useMonthlyBalance({ 
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

  // Handle balance saved in dialog
  const handleBalanceSaved = () => {
    toast({
      title: 'Balance inicial guardado',
      description: 'Cargando datos financieros...',
    });
    refreshData(true);
  };

  // Handler for balance changes in the MonthlyBalanceEditor
  const handleBalanceChange = (balance: number) => {
    console.log("Balance changed in editor:", balance);
    // We need to make sure the UI reflects the new balance
    refreshData(false);
  };

  // Handler for data refresh
  const handleRefresh = () => {
    console.log("Manual refresh requested");
    toast({
      title: 'Actualizando datos',
      description: 'Obteniendo datos más recientes...',
    });
    refreshData(true);
  };

  // Handler for date range change
  const handleDateRangeChange = (newRange: DayPickerDateRange) => {
    if (newRange.from && newRange.to) {
      updateDateRange(toFinancialDateRange(newRange));
    }
  };

  // Map the current month range function to match DateRangePicker's expected format
  const getDatePickerCurrentMonthRange = () => {
    const financialDateRange = getCurrentMonthRange();
    return toDayPickerDateRange(financialDateRange);
  };

  // Calculate total Zoho expenses - all expenses except those from Stripe
  const totalZohoExpenses = financialData.transactions
    .filter(tx => tx.type === 'expense' && tx.source !== 'Stripe')
    .reduce((sum, tx) => sum + tx.amount, 0);

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
      <DashboardHeader 
        dateRange={dateRange} 
        onDateRangeChange={handleDateRangeChange}
        getCurrentMonthRange={getDatePickerCurrentMonthRange}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!dataInitialized && (
          <InitialLoadPrompt onLoadData={handleInitialLoad} />
        )}
        
        {loading && <LoadingSpinner />}
        
        {error && (
          <ErrorDisplay error={error} onRetry={handleRefresh} />
        )}
        
        {dataInitialized && !loading && !error && (
          <DashboardContent 
            periodTitle={periodTitle}
            dateRange={dateRange}
            financialData={financialData}
            currentMonthDate={currentMonthDate}
            startingBalance={startingBalance}
            refreshData={refreshData}
            handleBalanceChange={handleBalanceChange}
            handleRefresh={handleRefresh}
            loading={loading}
            stripeIncome={stripeIncome}
            stripeFees={stripeFees}
            stripeTransactionFees={stripeTransactionFees}
            stripePayoutFees={stripePayoutFees}
            stripeAdditionalFees={stripeAdditionalFees}
            stripeNet={stripeNet}
            stripeFeePercentage={stripeFeePercentage}
            regularIncome={regularIncome}
            monthlyBalance={monthlyBalance}
            totalZohoExpenses={totalZohoExpenses}
          />
        )}

        {/* Sección de depuración */}
        <DebugSection 
          dateRange={dateRange}
          refreshData={refreshData}
          rawResponse={rawResponse}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
