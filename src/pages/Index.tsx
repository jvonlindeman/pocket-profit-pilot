
import React, { useState, useMemo } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { FinanceProvider } from '@/contexts/FinanceContext';

// Component imports
import DashboardHeader from '@/components/Dashboard/Header/DashboardHeader';
import LoadingErrorState from '@/components/Dashboard/LoadingErrorState';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';
import Footer from '@/components/Dashboard/Footer';
import InitialSetup from '@/components/Dashboard/InitialSetup';

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
    setStartingBalance,
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
  const { handleDateRangeChange, getDatePickerCurrentMonthRange } = useDateRangeManager({
    dateRange,
    updateDateRange,
    getCurrentMonthRange
  });
  
  const { createPeriodTitle } = useDateFormatter();
  
  // Title of the period
  const periodTitle = useMemo(() => 
    createPeriodTitle(dateRange.startDate, dateRange.endDate),
    [createPeriodTitle, dateRange.startDate, dateRange.endDate]
  );

  // Calculate total Zoho expenses - all expenses except those from Stripe
  const totalZohoExpenses = useMemo(() => 
    financialData.transactions
      .filter(tx => tx.type === 'expense' && tx.source !== 'Stripe')
      .reduce((sum, tx) => sum + tx.amount, 0),
    [financialData.transactions]
  );

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

  // Improved handler for balance changes in the MonthlyBalanceEditor
  const handleBalanceChange = (
    balance: number, 
    opexAmount: number = 35, 
    itbmAmount: number = 0, 
    profitPercentage: number = 1
  ) => {
    console.log("Balance changed in editor:", {
      balance,
      opexAmount,
      itbmAmount,
      profitPercentage
    });
    
    // Call the updateStartingBalance function with all parameters
    updateStartingBalance(
      balance, 
      currentMonthDate, 
      opexAmount,
      itbmAmount,
      profitPercentage
    ).then(success => {
      if (success) {
        // Immediately update local state for faster UI feedback
        setStartingBalance(balance);
        
        // Force a refresh to ensure all components get the updated data
        toast({
          title: 'Balance inicial actualizado',
          description: 'Actualizando datos financieros...',
        });
        
        // Refresh data from backend but without showing the loading state
        refreshData(false);
      }
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initial setup components */}
      <InitialSetup 
        dataInitialized={dataInitialized}
        onLoadData={handleInitialLoad}
        showBalanceDialog={showBalanceDialog}
        setShowBalanceDialog={setShowBalanceDialog}
        currentMonthDate={currentMonthDate}
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
        {/* Loading and error state handling */}
        <LoadingErrorState 
          loading={loading} 
          error={error}
          onRetry={handleRefresh}
        />
        
        {/* Dashboard content with Finance context provider */}
        {dataInitialized && !loading && !error && (
          <FinanceProvider
            summary={financialData.summary}
            transactions={financialData.transactions}
            dateRange={dateRange}
            stripeIncome={stripeIncome}
            stripeFees={stripeFees}
            stripeTransactionFees={stripeTransactionFees}
            stripePayoutFees={stripePayoutFees}
            stripeAdditionalFees={stripeAdditionalFees}
            stripeNet={stripeNet}
            stripeFeePercentage={stripeFeePercentage}
            regularIncome={regularIncome}
            collaboratorExpenses={financialData.expenseByCategory.filter(cat => cat.category.includes('Colaborador'))}
          >
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
          </FinanceProvider>
        )}

        {/* Debug section */}
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
