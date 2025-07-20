
import React from 'react';
import { useDashboardStateManager } from '@/components/Dashboard/DashboardStateManager';
import DashboardContent from '@/components/Dashboard/DashboardContent';

const Index = () => {
  const {
    // Data state
    dateRange,
    financialData,
    unpaidInvoices, // CRITICAL: Now properly destructured from state manager
    loading,
    error,
    dataInitialized,
    rawResponse,
    usingCachedData,
    cacheStatus,
    cacheChecked,
    hasCachedData,
    isRefreshing,
    
    // Financial data
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
    totalZohoExpenses,
    
    // Derived values
    periodTitle,
    currentMonthDate,
    calculatorKey,
    opexAmount,
    itbmAmount,
    profitPercentage,
    taxReservePercentage,
    includeZohoFiftyPercent,
    
    // Monthly balance
    monthlyBalance,
    updateMonthlyBalance,
    
    // UI state
    showBalanceDialog,
    setShowBalanceDialog,
    
    // Functions
    refreshData,
    
    // Global state
    globalRefreshInProgress,
  } = useDashboardStateManager();

  console.log('🏠 Index: FINAL DATA FLOW CHECK - unpaid invoices from state manager:', {
    unpaidInvoicesCount: unpaidInvoices?.length || 0,
    unpaidInvoicesTotal: unpaidInvoices?.reduce((sum, inv) => sum + inv.balance, 0) || 0,
    sampleInvoices: unpaidInvoices?.slice(0, 3).map(inv => ({
      customer: inv.customer_name,
      balance: inv.balance,
      invoice_id: inv.invoice_id
    })) || [],
    dataFlowComplete: true
  });

  const handleBalanceSaved = async (
    balance: number,
    opexAmount?: number,
    itbmAmount?: number,
    profitPercentage?: number,
    taxReservePercentage?: number,
    includeZohoFiftyPercent?: boolean,
    notes?: string
  ) => {
    const success = await updateMonthlyBalance(
      balance,
      opexAmount,
      itbmAmount,
      profitPercentage,
      taxReservePercentage,
      includeZohoFiftyPercent,
      notes
    );
    
    if (success) {
      setShowBalanceDialog(false);
    }
    
    return success;
  };

  return (
    <DashboardContent
      periodTitle={periodTitle}
      financialData={financialData}
      unpaidInvoices={unpaidInvoices || []} // CRITICAL: Pass unpaid invoices as direct prop
      loading={loading}
      error={error}
      dataInitialized={dataInitialized}
      hasCachedData={hasCachedData}
      usingCachedData={usingCachedData}
      isRefreshing={isRefreshing}
      cacheStatus={cacheStatus}
      stripeIncome={stripeIncome}
      stripeFees={stripeFees}
      stripeTransactionFees={stripeTransactionFees}
      stripePayoutFees={stripePayoutFees}
      stripeAdditionalFees={stripeAdditionalFees}
      stripeNet={stripeNet}
      stripeFeePercentage={stripeFeePercentage}
      regularIncome={regularIncome}
      collaboratorExpenses={collaboratorExpenses}
      startingBalance={startingBalance}
      totalZohoExpenses={totalZohoExpenses}
      calculatorKey={calculatorKey}
      opexAmount={opexAmount}
      itbmAmount={itbmAmount}
      profitPercentage={profitPercentage}
      taxReservePercentage={taxReservePercentage}
      includeZohoFiftyPercent={includeZohoFiftyPercent}
      monthlyBalance={monthlyBalance}
      refreshData={refreshData}
      showBalanceDialog={showBalanceDialog}
      setShowBalanceDialog={setShowBalanceDialog}
      currentDate={currentMonthDate}
      onBalanceSaved={handleBalanceSaved}
    />
  );
};

export default Index;
