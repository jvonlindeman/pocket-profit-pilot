
import React, { useState } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useToast } from '@/hooks/use-toast';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';
import Header from '@/components/Dashboard/Header';
import Footer from '@/components/Dashboard/Footer';
import WelcomeMessage from '@/components/Dashboard/WelcomeMessage';
import LoadingIndicator from '@/components/Dashboard/LoadingIndicator';
import ErrorDisplay from '@/components/Dashboard/ErrorDisplay';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DebugSection from '@/components/Dashboard/DebugSection';

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
    updateStripeOverride
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
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

  // Manejador para actualizar datos
  const handleRefresh = () => {
    console.log("Manual refresh requested");
    toast({
      title: 'Actualizando datos',
      description: 'Obteniendo datos más recientes...',
    });
    refreshData(true);
  };

  // Handler for stripe override changes
  const handleStripeOverrideChange = (value: number | null) => {
    updateStripeOverride(value);
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
      
      {/* Cabecera del Dashboard */}
      <Header 
        dateRange={dateRange}
        updateDateRange={updateDateRange}
        getCurrentMonthRange={getCurrentMonthRange}
      />

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!dataInitialized && (
          <WelcomeMessage onInitialLoad={handleInitialLoad} />
        )}
        
        {loading && <LoadingIndicator />}
        
        {error && (
          <ErrorDisplay error={error} onRetry={handleRefresh} />
        )}
        
        {dataInitialized && !loading && !error && (
          <DashboardContent
            financialData={financialData}
            periodTitle={periodTitle}
            handleRefresh={handleRefresh}
            loading={loading}
            dateRange={dateRange}
            stripeIncome={stripeIncome}
            regularIncome={regularIncome}
            collaboratorExpenses={collaboratorExpenses}
            stripeOverride={stripeOverride}
            onStripeOverrideChange={handleStripeOverrideChange}
          />
        )}
        
        {/* Sección de depuración del webhook */}
        <DebugSection 
          dateRange={dateRange}
          refreshDataFunction={refreshData}
          rawResponse={rawResponse}
        />
      </main>

      {/* Pie de página */}
      <Footer />
    </div>
  );
};

export default Index;
