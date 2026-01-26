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
    isRefreshing: dashboardState.isRefreshing,
  });

  console.log("🏠 DashboardPageWrapper: Rendering", {
    dataInitialized: dashboardState.dataInitialized,
    loading: dashboardState.loading,
    isRefreshing: dashboardState.isRefreshing,
    error: !!dashboardState.error,
    transactionCount: dashboardState.financialData.transactions.length
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initial setup components - requires explicit user action */}
      <InitialSetup 
        dataInitialized={dashboardState.dataInitialized}
        onLoadData={handleInitialLoad}
        showBalanceDialog={dashboardState.showBalanceDialog}
        setShowBalanceDialog={dashboardState.setShowBalanceDialog}
        currentMonthDate={dashboardState.currentMonthDate}
        onBalanceSaved={handleBalanceSaved}
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
        {(dashboardState.isRefreshing || dashboardState.globalRefreshInProgress) && dashboardState.dataInitialized && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              <span className="text-blue-800 text-sm">
                Actualizando datos...
              </span>
            </div>
          </div>
        )}
        
        {/* Dashboard content */}
        {(dashboardState.dataInitialized || !dashboardState.dataInitialized) && !dashboardState.error && (
          <DashboardContent 
            periodTitle={dashboardState.periodTitle}
            financialData={dashboardState.financialData}
            loading={dashboardState.loading}
            error={dashboardState.error}
            dataInitialized={dashboardState.dataInitialized}
            isRefreshing={dashboardState.isRefreshing || dashboardState.globalRefreshInProgress}
            stripeIncome={dashboardState.stripeIncome}
            stripeFees={dashboardState.stripeFees}
            stripeTransactionFees={dashboardState.stripeTransactionFees}
            stripePayoutFees={dashboardState.stripePayoutFees}
            stripeAdditionalFees={dashboardState.stripeAdditionalFees}
            stripeNet={dashboardState.stripeNet}
            stripeFeePercentage={dashboardState.stripeFeePercentage}
            regularIncome={dashboardState.regularIncome}
            collaboratorExpenses={dashboardState.collaboratorExpenses}
            unpaidInvoices={dashboardState.unpaidInvoices}
            startingBalance={dashboardState.startingBalance}
            totalZohoExpenses={dashboardState.totalZohoExpenses}
            calculatorKey={dashboardState.calculatorKey}
            opexAmount={dashboardState.opexAmount}
            itbmAmount={dashboardState.itbmAmount}
            profitPercentage={dashboardState.profitPercentage}
            taxReservePercentage={dashboardState.taxReservePercentage}
            includeZohoFiftyPercent={dashboardState.includeZohoFiftyPercent}
            monthlyBalance={dashboardState.monthlyBalance}
            refreshData={dashboardState.refreshData}
            showBalanceDialog={dashboardState.showBalanceDialog}
            setShowBalanceDialog={dashboardState.setShowBalanceDialog}
            currentDate={dashboardState.dateRange.endDate || new Date()}
            stripeSavingsPercentage={dashboardState.stripeSavingsPercentage}
            onBalanceSaved={handleBalanceSaved}
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
