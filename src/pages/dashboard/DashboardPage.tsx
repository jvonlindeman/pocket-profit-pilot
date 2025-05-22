import React, { useState } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import DashboardProvider from './context/DashboardProvider';
import { useDateRangeManager } from '@/hooks/useDateRangeManager';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import DashboardMain from './components/DashboardMain';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

const DashboardPage = () => {
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
  
  const { toast } = useToast();
  
  // Convert financial date range to compatible format for useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  
  const { checkBalanceExists, monthlyBalance } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });

  const { handleDateRangeChange, getDatePickerCurrentMonthRange } = useDateRangeManager({
    dateRange,
    updateDateRange,
    getCurrentMonthRange
  });
  
  const { createPeriodTitle } = useDateFormatter();

  // Calculate total Zoho expenses - all expenses except those from Stripe
  const totalZohoExpenses = React.useMemo(() => 
    financialData.transactions
      .filter(tx => tx.type === 'expense' && tx.source !== 'Stripe')
      .reduce((sum, tx) => sum + tx.amount, 0),
    [financialData.transactions]
  );

  // Period title calculation
  const periodTitle = React.useMemo(() => 
    createPeriodTitle(dateRange.startDate, dateRange.endDate),
    [createPeriodTitle, dateRange.startDate, dateRange.endDate]
  );

  // Handler for initial data loading
  const handleInitialLoad = async () => {
    const balanceExists = await checkBalanceExists();
    
    if (!balanceExists) {
      // Show dialog to set initial balance
      setShowBalanceDialog(true);
    } else {
      toast({
        title: 'Cargando datos financieros',
        description: 'Obteniendo datos de Zoho Books y Stripe',
      });
      refreshData(true);
    }
  };

  // Balance dialog state
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);

  // Callback for when balance is saved
  const handleBalanceSaved = () => {
    toast({
      title: 'Balance inicial guardado',
      description: 'Cargando datos financieros...',
    });
    refreshData(true);
  };

  // Handler for balance changes
  const handleBalanceChange = (
    balance: number, 
    opexAmount: number = 35, 
    itbmAmount: number = 0, 
    profitPercentage: number = 1,
    notes?: string
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
      profitPercentage,
      notes
    ).then(success => {
      if (success) {
        setStartingBalance(balance);
        
        toast({
          title: 'Balance inicial actualizado',
          description: 'Actualizando datos financieros...',
        });
        
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
    <DashboardLayout>
      <DashboardProvider
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        getCurrentMonthRange={getDatePickerCurrentMonthRange}
        dataInitialized={dataInitialized}
        onLoadData={handleInitialLoad}
        showBalanceDialog={showBalanceDialog}
        setShowBalanceDialog={setShowBalanceDialog}
        currentMonthDate={currentMonthDate}
        onBalanceSaved={handleBalanceSaved}
        loading={loading}
        error={error}
        onRetry={handleRefresh}
        rawResponse={rawResponse}
        refreshData={refreshData}
        financialData={financialData}
        startingBalance={startingBalance}
        handleBalanceChange={handleBalanceChange}
        handleRefresh={handleRefresh}
        periodTitle={periodTitle}
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
        collaboratorExpenses={collaboratorExpenses}
      >
        <DashboardMain />
      </DashboardProvider>
    </DashboardLayout>
  );
};

export default DashboardPage;
