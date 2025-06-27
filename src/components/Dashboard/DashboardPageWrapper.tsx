
import React from 'react';
import DashboardHeader from '@/components/Dashboard/Header/DashboardHeader';
import LoadingErrorState from '@/components/Dashboard/LoadingErrorState';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';
import Footer from '@/components/Dashboard/Footer';
import InitialSetup from '@/components/Dashboard/InitialSetup';
import { useDashboardStateManager } from './DashboardStateManager';
import { useDashboardDataHandlers } from './DashboardDataHandlers';

const DashboardPageWrapper: React.FC = () => {
  const dashboardState = useDashboardStateManager();
  
  const {
    handleInitialLoad,
    handleBalanceSaved,
    handleBalanceChange,
    handleRefresh,
  } = useDashboardDataHandlers({
    checkBalanceExists: dashboardState.checkBalanceExists,
    setShowBalanceDialog: dashboardState.setShowBalanceDialog,
    refreshData: dashboardState.refreshData,
    updateMonthlyBalance: dashboardState.updateMonthlyBalance,
    setStartingBalance: dashboardState.setStartingBalance,
    hasCachedData: dashboardState.hasCachedData,
    isRefreshing: dashboardState.isRefreshing,
  });

  console.log("🏠 DashboardPageWrapper: Rendering with PASSIVE MODE + SMART REFRESH (FIXED)", {
    dataInitialized: dashboardState.dataInitialized,
    loading: dashboardState.loading,
    isRefreshing: dashboardState.isRefreshing,
    error: !!dashboardState.error,
    cacheChecked: dashboardState.cacheChecked,
    hasCachedData: dashboardState.hasCachedData,
    usingCachedData: dashboardState.usingCachedData,
    transactionCount: dashboardState.financialData.transactions.length,
    autoLoadingDisabled: true,
    smartRefreshEnabled: true,
    monthlyBalanceId: dashboardState.monthlyBalance?.id,
    monthlyBalanceTimestamp: dashboardState.monthlyBalance?.updated_at,
    includeZohoFiftyPercent: dashboardState.includeZohoFiftyPercent // TRACKING THE NEW VALUE
  });

  const coreData = {
    periodTitle: dashboardState.periodTitle,
    dateRange: dashboardState.dateRange,
    financialData: dashboardState.financialData,
    currentMonthDate: dashboardState.currentMonthDate,
    monthlyBalance: dashboardState.monthlyBalance,
    totalZohoExpenses: dashboardState.totalZohoExpenses,
    unpaidInvoices: dashboardState.unpaidInvoices,
    startingBalance: dashboardState.startingBalance,
    regularIncome: dashboardState.regularIncome,
  };

  const stripeData = {
    stripeIncome: dashboardState.stripeIncome,
    stripeFees: dashboardState.stripeFees,
    stripeTransactionFees: dashboardState.stripeTransactionFees,
    stripePayoutFees: dashboardState.stripePayoutFees,
    stripeAdditionalFees: dashboardState.stripeAdditionalFees,
    stripeNet: dashboardState.stripeNet,
    stripeFeePercentage: dashboardState.stripeFeePercentage,
  };

  const actions = {
    refreshData: dashboardState.refreshData,
    handleBalanceChange: handleBalanceChange,
    handleRefresh: handleRefresh,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initial setup components - now requires explicit user action */}
      <InitialSetup 
        dataInitialized={dashboardState.dataInitialized}
        onLoadData={handleInitialLoad}
        showBalanceDialog={dashboardState.showBalanceDialog}
        setShowBalanceDialog={dashboardState.setShowBalanceDialog}
        currentMonthDate={dashboardState.currentMonthDate}
        onBalanceSaved={handleBalanceSaved}
        cacheChecked={dashboardState.cacheChecked}
        hasCachedData={dashboardState.hasCachedData}
      />
      
      {/* Header section */}
      <DashboardHeader 
        dateRange={dashboardState.dateRange} 
        onDateRangeChange={dashboardState.handleDateRangeChange}
        getCurrentMonthRange={dashboardState.getDatePickerCurrentMonthRange}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading and error state handling */}
        <LoadingErrorState 
          loading={dashboardState.loading} 
          error={dashboardState.error}
          onRetry={handleRefresh}
        />
        
        {/* Show refreshing indicator if data exists but is being refreshed */}
        {dashboardState.isRefreshing && dashboardState.dataInitialized && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              <span className="text-blue-800 text-sm">
                Actualizando datos en segundo plano...
              </span>
            </div>
          </div>
        )}
        
        {/* Dashboard content - only shows when data is explicitly loaded */}
        {dashboardState.dataInitialized && !dashboardState.error && (
          <DashboardContent 
            coreData={coreData}
            stripeData={stripeData}
            actions={actions}
            loading={dashboardState.loading}
          />
        )}

        {/* Debug section */}
        <DebugSection 
          dateRange={dashboardState.dateRange}
          refreshData={dashboardState.refreshData}
          rawResponse={dashboardState.rawResponse}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DashboardPageWrapper;
