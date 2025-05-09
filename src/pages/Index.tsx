
import React, { useState } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';
import ZohoDebug from '@/components/ZohoDebug';

// Import our new components
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import DashboardFooter from '@/components/Dashboard/DashboardFooter';
import WelcomeBanner from '@/components/Dashboard/WelcomeBanner';
import LoadingIndicator from '@/components/Dashboard/LoadingIndicator';
import ErrorDisplay from '@/components/Dashboard/ErrorDisplay';
import DebugInformation from '@/components/Dashboard/DebugInformation';
import PeriodHeading from '@/components/Dashboard/PeriodHeading';
import CacheNotification from '@/components/Dashboard/CacheNotification';
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
    clearCacheAndRefresh,
    dataInitialized,
    rawResponse,
    stripeIncome,
    regularIncome,
    collaboratorExpenses,
    usingCachedData,
    partialRefresh,
    cacheStats,
    stripeOverride,
    startingBalance
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const { checkBalanceExists } = useMonthlyBalance({ currentDate: dateRange.startDate });
  const { toast } = useToast();

  // Formateamos fechas para títulos
  const formatDateForTitle = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Título del periodo
  const periodTitle = `${formatDateForTitle(dateRange.startDate)} - ${formatDateForTitle(dateRange.endDate)}`;

  // Manejador para cargar datos iniciales
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
      refreshData(false); // Use cache when available
    }
  };

  // Handle balance saved in dialog
  const handleBalanceSaved = () => {
    toast({
      title: 'Balance inicial guardado',
      description: 'Cargando datos financieros...',
    });
    refreshData(false); // Use cache when available
  };

  // Manejador para actualizar datos
  const handleRefresh = () => {
    console.log("Standard refresh requested (will use cache if available)");
    toast({
      title: 'Actualizando datos',
      description: 'Obteniendo datos más recientes...',
    });
    refreshData(false); // Use the cache when available
  };

  // Manejador para forzar actualización desde API
  const handleForceRefresh = () => {
    console.log("Force refresh requested (bypassing cache)");
    toast({
      title: 'Forzando actualización',
      description: 'Obteniendo datos directamente de la API...',
    });
    refreshData(true); // Force refresh from API
  };

  // Manejador para limpiar caché y forzar actualización
  const handleClearCacheAndRefresh = () => {
    console.log("Clear cache and force refresh requested");
    toast({
      title: 'Limpiando caché y forzando actualización',
      description: 'Limpiando caché y obteniendo datos frescos...',
    });
    clearCacheAndRefresh(); // Clear cache and force refresh
  };

  // Manejador para alternar modo de depuración
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    toast({
      title: `Modo depuración ${!debugMode ? 'activado' : 'desactivado'}`,
      description: !debugMode 
        ? 'Se mostrará información adicional para depuración' 
        : 'Se ocultará la información de depuración',
    });
  };

  // Prepare Stripe data for chart - add safety checks
  const getStripeDataForChart = () => {
    // Check if we have valid data structure
    if (!financialData || 
        !financialData.dailyData || 
        !financialData.dailyData.income || 
        !financialData.dailyData.income.labels || 
        !Array.isArray(financialData.dailyData.income.labels) ||
        !financialData.dailyData.income.labels.length) {
      // Return empty data structure when data is not available
      return { labels: [], values: [] };
    }

    // Si solo hay un valor de Stripe para todo el período, distribúyelo a lo largo del gráfico
    if (stripeIncome > 0) {
      const labels = financialData.dailyData.income.labels;
      const values = new Array(labels.length).fill(stripeIncome / labels.length);
      return { labels, values };
    }
    return { labels: [], values: [] };
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

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!dataInitialized && (
          <WelcomeBanner handleInitialLoad={handleInitialLoad} />
        )}
        
        {loading && (
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

            {/* Periodo y botones de actualización */}
            <PeriodHeading 
              periodTitle={periodTitle}
              handleRefresh={handleRefresh}
              handleForceRefresh={handleForceRefresh}
              handleClearCacheAndRefresh={handleClearCacheAndRefresh}
            />

            {/* Cache Notifications */}
            <CacheNotification 
              usingCachedData={usingCachedData} 
              partialRefresh={partialRefresh}
              cacheStats={cacheStats}
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
              loading={loading}
              getStripeDataForChart={getStripeDataForChart}
            />
          </>
        )}

        {/* Zoho Debug componente mejorado */}
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
