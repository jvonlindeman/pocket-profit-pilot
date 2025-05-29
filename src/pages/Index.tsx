
import React from 'react';

// Component imports
import DashboardHeader from '@/components/Dashboard/Header/DashboardHeader';
import LoadingErrorState from '@/components/Dashboard/LoadingErrorState';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';
import Footer from '@/components/Dashboard/Footer';
import InitialSetup from '@/components/Dashboard/InitialSetup';

// Custom hooks for logic separation
import { useIndexPageLogic } from '@/components/Dashboard/Index/IndexPageLogic';
import { useIndexEventHandlers } from '@/components/Dashboard/Index/IndexEventHandlers';

const Index = () => {
  // Extract all state and computed values
  const {
    dateRange,
    financialData,
    loading,
    error,
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
    unpaidInvoices,
    startingBalance,
    setStartingBalance,
    cacheChecked,
    hasCachedData,
    showBalanceDialog,
    setShowBalanceDialog,
    currentMonthDate,
    periodTitle,
    totalZohoExpenses,
    checkBalanceExists,
    monthlyBalance,
    updateMonthlyBalance,
    toast,
    handleDateRangeChange,
    getDatePickerCurrentMonthRange
  } = useIndexPageLogic();

  // Extract all event handlers
  const {
    handleInitialLoad,
    handleBalanceSaved,
    handleBalanceChange,
    handleRefresh
  } = useIndexEventHandlers({
    checkBalanceExists,
    setShowBalanceDialog,
    refreshData,
    updateMonthlyBalance,
    setStartingBalance,
    toast,
    hasCachedData
  });

  console.log("🏠 Index: Rendering with PASSIVE MODE", {
    dataInitialized,
    loading,
    error: !!error,
    cacheChecked,
    hasCachedData,
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
