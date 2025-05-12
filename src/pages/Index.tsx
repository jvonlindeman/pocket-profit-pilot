
import React, { useState, useEffect } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';
import ZohoDebug from '@/components/ZohoDebug';

// Import our components
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import DashboardFooter from '@/components/Dashboard/DashboardFooter';
import WelcomeBanner from '@/components/Dashboard/WelcomeBanner';
import LoadingIndicator from '@/components/Dashboard/LoadingIndicator';
import ErrorDisplay from '@/components/Dashboard/ErrorDisplay';
import DebugInformation from '@/components/Dashboard/DebugInformation';
import PeriodHeading from '@/components/Dashboard/PeriodHeading';
import EmptyTransactionsNotification from '@/components/Dashboard/EmptyTransactionsNotification';
import DebugPanel from '@/components/Dashboard/DebugPanel';
import MainDashboard from '@/components/Dashboard/MainDashboard';

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
    regularIncome,
    collaboratorExpenses,
    stripeOverride,
    startingBalance,
    initialLoadAttempted,
    clearCacheAndRefresh,
    forceManualRefresh,
    getStripeDataForChart
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [localLoading, setLocalLoading] = useState(false); // Local loading state
  const { checkBalanceExists } = useMonthlyBalance({ currentDate: dateRange.startDate });
  const { toast } = useToast();

  // Format dates for titles
  const formatDateForTitle = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Period title
  const periodTitle = `${formatDateForTitle(dateRange.startDate)} - ${formatDateForTitle(dateRange.endDate)}`;
  
  // Check if we should show welcome banner
  const shouldShowWelcome = !dataInitialized && !initialLoadAttempted;

  // Handler for initial data loading
  const handleInitialLoad = async () => {
    // If already loading, prevent duplicate loads
    if (loading || localLoading) {
      console.log('💫 Initial load already in progress, skipping duplicate request');
      return;
    }
    
    console.log('💫 handleInitialLoad called, checking balance exists');
    
    // Set local loading state
    setLocalLoading(true);
    
    try {
      // Check if we need to set the initial balance first
      const balanceExists = await checkBalanceExists();
      
      if (!balanceExists) {
        // Show dialog to set initial balance
        console.log('💰 No initial balance found, showing dialog');
        setShowBalanceDialog(true);
      } else {
        // Balance already exists, just load data
        console.log('💰 Initial balance exists, loading data');
        toast({
          title: 'Cargando datos financieros',
          description: 'Obteniendo datos de Zoho Books y Stripe',
        });
        await refreshData(true); // Always force refresh
      }
    } catch (error) {
      console.error('Error in handleInitialLoad:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al cargar los datos iniciales',
        variant: 'destructive'
      });
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle balance saved in dialog
  const handleBalanceSaved = async () => {
    // Set local loading state
    setLocalLoading(true);
    
    try {
      toast({
        title: 'Balance inicial guardado',
        description: 'Cargando datos financieros...',
      });
      await refreshData(true); // Always force refresh
    } catch (error) {
      console.error('Error in handleBalanceSaved:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Handler for refreshing data
  const handleRefresh = async () => {
    // If already loading, prevent duplicate loads
    if (loading || localLoading) {
      console.log('💫 Refresh already in progress, skipping duplicate request');
      return;
    }
    
    setLocalLoading(true);
    
    try {
      console.log("Standard refresh requested (always forcing refresh)");
      toast({
        title: 'Actualizando datos',
        description: 'Obteniendo datos más recientes...',
      });
      await refreshData(true); // Always force refresh
    } catch (error) {
      console.error('Error in handleRefresh:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Handler for toggling debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    toast({
      title: `Modo depuración ${!debugMode ? 'activado' : 'desactivado'}`,
      description: !debugMode 
        ? 'Se mostrará información adicional para depuración' 
        : 'Se ocultará la información de depuración',
    });
  };

  // Add debug logs to track user interaction and component state
  useEffect(() => {
    console.log('🔄 Index component state:', { 
      dataInitialized, 
      loading, 
      localLoading,
      error, 
      showBalanceDialog,
      initialLoadAttempted,
      shouldShowWelcome
    });
  }, [dataInitialized, loading, localLoading, error, showBalanceDialog, initialLoadAttempted]);

  // Combined loading state
  const isLoading = loading || localLoading;

  // Handlers for the additional functions
  const handleForceRefresh = async () => {
    if (forceManualRefresh) {
      await forceManualRefresh();
    } else {
      await handleRefresh();
    }
  };

  const handleClearCacheAndRefresh = async () => {
    if (clearCacheAndRefresh) {
      await clearCacheAndRefresh();
    } else {
      await handleRefresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dialog to set initial balance */}
      <InitialBalanceDialog 
        open={showBalanceDialog} 
        onOpenChange={setShowBalanceDialog} 
        currentDate={dateRange.startDate}
        onBalanceSaved={handleBalanceSaved}
      />
      
      {/* Dashboard Header */}
      <DashboardHeader 
        dateRange={dateRange}
        updateDateRange={updateDateRange}
        getCurrentMonthRange={getCurrentMonthRange}
        toggleDebugMode={toggleDebugMode}
        debugMode={debugMode}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shouldShowWelcome && (
          <WelcomeBanner 
            handleInitialLoad={handleInitialLoad} 
            isLoading={isLoading}
          />
        )}
        
        {loading && !dataInitialized && (
          <LoadingIndicator />
        )}
        
        {error && (
          <ErrorDisplay 
            error={error}
            handleRefresh={handleRefresh}
            handleForceRefresh={handleForceRefresh}
            handleClearCacheAndRefresh={handleClearCacheAndRefresh}
          />
        )}
        
        {dataInitialized && !loading && !error && (
          <>
            {/* Debugging information */}
            {debugMode && (
              <DebugInformation 
                financialData={financialData}
                stripeIncome={stripeIncome}
                stripeOverride={stripeOverride}
                regularIncome={regularIncome}
                handleClearCacheAndRefresh={handleClearCacheAndRefresh}
              />
            )}

            {/* Period heading and refresh button */}
            <PeriodHeading 
              periodTitle={periodTitle}
              handleRefresh={handleRefresh}
              handleForceRefresh={handleForceRefresh}
              handleClearCacheAndRefresh={handleClearCacheAndRefresh}
            />

            {/* Empty transactions notification */}
            <EmptyTransactionsNotification 
              isEmpty={financialData.transactions.length === 0} 
            />

            {/* Main Dashboard Content */}
            <MainDashboard 
              financialData={financialData}
              stripeIncome={stripeIncome}
              regularIncome={regularIncome}
              stripeOverride={stripeOverride}
              collaboratorExpenses={collaboratorExpenses}
              dateRange={dateRange}
              handleRefresh={handleRefresh}
              loading={isLoading}
              getStripeDataForChart={getStripeDataForChart}
            />
          </>
        )}

        {/* Zoho Debug component */}
        <div className="mt-8">
          <ZohoDebug />
        </div>

        {/* Debug Panel for Webhook */}
        <DebugPanel 
          debugMode={debugMode}
          dateRange={dateRange}
          refreshData={refreshData}
          rawResponse={rawResponse}
        />
      </main>

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
};

export default Index;
