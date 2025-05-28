import React, { useState, useMemo } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';

// Component imports
import DashboardHeader from '@/components/Dashboard/Header/DashboardHeader';
import LoadingErrorState from '@/components/Dashboard/LoadingErrorState';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';
import Footer from '@/components/Dashboard/Footer';
import InitialSetup from '@/components/Dashboard/InitialSetup';

const Index = () => {
  // PASSIVE MODE: useFinanceData no longer auto-loads data
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
    unpaidInvoices,
    startingBalance,
    updateStartingBalance,
    setStartingBalance,
    usingCachedData,
    cacheStatus,
    cacheChecked,
    hasCachedData
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  
  // Convert financial date range to compatible format for useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  
  const { checkBalanceExists, monthlyBalance, updateMonthlyBalance } = useMonthlyBalance({ 
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

  // Handler for manual data loading - triggered by user action only
  const handleInitialLoad = async () => {
    console.log("🚀 Index: Manual data load requested by user", {
      cacheChecked,
      hasCachedData,
      dataInitialized
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
  };

  // Handle balance saved in dialog
  const handleBalanceSaved = () => {
    toast({
      title: 'Balance inicial guardado',
      description: 'Cargando datos financieros...',
    });
    refreshData(false); // Manual load after balance is set
  };

  // Updated handler for balance changes - now with immediate updates and comprehensive logging
  const handleBalanceChange = async (
    balance: number, 
    opexAmount: number = 35, 
    itbmAmount: number = 0, 
    profitPercentage: number = 1,
    taxReservePercentage: number = 5
  ) => {
    console.log("💰 Index: handleBalanceChange CALLED WITH PARAMETERS:", {
      balance: { value: balance, type: typeof balance },
      opexAmount: { value: opexAmount, type: typeof opexAmount },
      itbmAmount: { value: itbmAmount, type: typeof itbmAmount },
      profitPercentage: { value: profitPercentage, type: typeof profitPercentage, isZero: profitPercentage === 0 },
      taxReservePercentage: { value: taxReservePercentage, type: typeof taxReservePercentage, isZero: taxReservePercentage === 0 },
      timestamp: new Date().toISOString()
    });
    
    try {
      // 1. IMMEDIATE: Update the monthly balance with optimistic update
      console.log("💰 Index: Calling updateMonthlyBalance with parameters:", {
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
        console.log("💰 Index: updateMonthlyBalance SUCCESS - Updating local starting balance to:", balance);
        setStartingBalance(balance);
        
        // 3. Show immediate feedback
        toast({
          title: 'Balance actualizado inmediatamente',
          description: 'Los cálculos se han actualizado',
        });

        // 4. BACKGROUND: Update backend data (no loading state)
        console.log("💰 Index: Triggering background data refresh");
        refreshData(false);
      } else {
        console.error("💰 Index: updateMonthlyBalance FAILED");
        throw new Error("Failed to update monthly balance");
      }
    } catch (error) {
      console.error("💰 Index: ERROR in handleBalanceChange:", error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el balance',
        variant: 'destructive',
      });
    }
  };

  // Handler for data refresh
  const handleRefresh = () => {
    console.log("Manual refresh requested - user action");
    toast({
      title: 'Actualizando datos',
      description: 'Obteniendo datos más recientes...',
    });
    refreshData(true); // Force refresh for manual user action
  };

  console.log("🏠 Index: Rendering with PASSIVE MODE", {
    dataInitialized,
    loading,
    error: !!error,
    cacheChecked,
    hasCachedData,
    usingCachedData,
    transactionCount: financialData.transactions.length,
    autoLoadingDisabled: true,
    monthlyBalanceId: monthlyBalance?.id,
    monthlyBalanceTimestamp: monthlyBalance?.updated_at
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initial setup components - now requires explicit user action */}
      <InitialSetup 
        dataInitialized={dataInitialized}
        onLoadData={handleInitialLoad}
        showBalanceDialog={showBalanceDialog}
        setShowBalanceDialog={setShowBalanceDialog}
        currentMonthDate={currentMonthDate}
        onBalanceSaved={handleBalanceSaved}
        cacheChecked={cacheChecked}
        hasCachedData={hasCachedData}
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
        
        {/* Dashboard content - only shows when data is explicitly loaded */}
        {dataInitialized && !error && (
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
            unpaidInvoices={unpaidInvoices}
          />
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
