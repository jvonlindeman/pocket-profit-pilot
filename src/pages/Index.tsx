import React, { useState, useEffect } from 'react';
import DateRangePicker from '@/components/Dashboard/DateRangePicker';
import FinanceSummary from '@/components/Dashboard/FinanceSummary';
import TransactionList from '@/components/Dashboard/TransactionList';
import MonthlyBalanceEditor from '@/components/Dashboard/MonthlyBalanceEditor';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';
import SalaryCalculator from '@/components/Dashboard/SalaryCalculator';
import CacheStats from '@/components/Dashboard/CacheStats';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, Bug, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import WebhookDebug from '@/components/WebhookDebug';
import WebhookRequestDebug from '@/components/WebhookRequestDebug';
import StripeDebug from '@/components/StripeDebug';
import { DateRange } from 'react-day-picker';
import { toFinancialDateRange, toDayPickerDateRange } from '@/utils/dateRangeAdapter';

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
    usingCachedData,
    cacheStatus
  } = useFinanceData();
  
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [calculatorRefreshKey, setCalculatorRefreshKey] = useState(0);
  
  // Convert financial date range to compatible format for useMonthlyBalance
  const currentMonthDate = dateRange.startDate || new Date();
  
  const { checkBalanceExists, monthlyBalance, fetchMonthlyBalance } = useMonthlyBalance({ 
    currentDate: currentMonthDate
  });
  
  const { toast } = useToast();

  // Format dates for titles with safety check
  const formatDateForTitle = (date: Date | undefined) => {
    if (!date) return 'Fecha inválida';
    
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date for title:", error);
      return 'Fecha inválida';
    }
  };

  // Title of the period with safety checks
  const periodTitle = dateRange.startDate && dateRange.endDate 
    ? `${formatDateForTitle(dateRange.startDate)} - ${formatDateForTitle(dateRange.endDate)}`
    : 'Periodo no seleccionado';

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

  // Handle balance saved in dialog - now triggers calculator refresh
  const handleBalanceSaved = () => {
    toast({
      title: 'Balance inicial guardado',
      description: 'Cargando datos financieros...',
    });
    refreshData(true);
    // Force calculator refresh
    setCalculatorRefreshKey(prev => prev + 1);
  };

  // Handler for balance changes in the MonthlyBalanceEditor - improved to trigger calculator refresh
  const handleBalanceChange = (balance: number) => {
    console.log("Balance changed in editor:", balance);
    // We need to make sure the UI reflects the new balance
    refreshData(false);
    // Force calculator refresh
    setCalculatorRefreshKey(prev => prev + 1);
  };

  // Handler for data refresh
  const handleRefresh = () => {
    console.log("Manual refresh requested");
    toast({
      title: 'Actualizando datos',
      description: 'Obteniendo datos más recientes...',
    });
    refreshData(true);
    // Force calculator refresh
    setCalculatorRefreshKey(prev => prev + 1);
  };

  // Adapter function to convert between date range formats
  const handleDateRangeChange = (newRange: DateRange) => {
    if (newRange.from && newRange.to) {
      updateDateRange(toFinancialDateRange(newRange));
    }
  };

  // Map the current month range function to match DateRangePicker's expected format
  const getDatePickerCurrentMonthRange = () => {
    const financialDateRange = getCurrentMonthRange();
    return toDayPickerDateRange(financialDateRange);
  };

  // Ensure we fetch the monthly balance when date range changes
  useEffect(() => {
    if (currentMonthDate) {
      fetchMonthlyBalance();
    }
  }, [currentMonthDate, fetchMonthlyBalance]);

  // Get calculator values from the monthly balance
  const opexAmount = monthlyBalance?.opex_amount !== null ? monthlyBalance?.opex_amount || 35 : 35;
  const itbmAmount = monthlyBalance?.itbm_amount !== null ? monthlyBalance?.itbm_amount || 0 : 0;
  const profitPercentage = monthlyBalance?.profit_percentage !== null ? monthlyBalance?.profit_percentage || 1 : 1;

  // Calculate total Zoho expenses - all expenses except those from Stripe
  const totalZohoExpenses = financialData.transactions
    .filter(tx => tx.type === 'expense' && tx.source !== 'Stripe')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dialog to set initial balance */}
      <InitialBalanceDialog 
        open={showBalanceDialog} 
        onOpenChange={setShowBalanceDialog} 
        currentDate={currentMonthDate}
        onBalanceSaved={handleBalanceSaved}
      />
      
      {/* Header section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analizador Financiero</h1>
              <p className="mt-1 text-sm text-gray-500">Análisis de ingresos y gastos para tu agencia</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Link>
              </Button>
              <div className="w-full md:w-64">
                <DateRangePicker
                  dateRange={toDayPickerDateRange(dateRange)}
                  onRangeChange={handleDateRangeChange}
                  getCurrentMonthRange={getDatePickerCurrentMonthRange}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!dataInitialized && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Bienvenido al Analizador Financiero</h2>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              Haz clic en el botón para cargar los datos financieros del periodo seleccionado.
            </p>
            <Button onClick={handleInitialLoad} className="gap-2">
              <Play className="h-4 w-4" /> Cargar Datos Financieros
            </Button>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-finance-profit"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p>{error}</p>
            <Button variant="outline" className="mt-2" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
            </Button>
          </div>
        )}
        
        {dataInitialized && !loading && !error && (
          <>
            {/* Period and refresh button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">
                Periodo: <span className="text-gray-900">{periodTitle}</span>
              </h2>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
              </Button>
            </div>
            
            {/* Cache information - Updated to use CacheStats instead of CacheInfo */}
            <CacheStats 
              dateRange={dateRange}
              cacheStatus={cacheStatus}
              isUsingCache={usingCachedData}
              onRefresh={() => refreshData(true)}
            />

            {/* Warning message when no transactions exist */}
            {financialData.transactions.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
                <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
                <p className="mt-1 text-sm">Intenta seleccionar un periodo diferente o verificar la configuración de Zoho Books.</p>
              </div>
            )}

            {/* Monthly Balance Editor moved up to be above FinanceSummary */}
            <div className="mb-6">
              <MonthlyBalanceEditor 
                currentDate={currentMonthDate}
                onBalanceChange={handleBalanceChange}
              />
            </div>

            {/* New Salary Calculator - Updated with additional props and key for refreshing */}
            <div className="mb-6">
              <SalaryCalculator 
                key={`salary-calculator-${calculatorRefreshKey}`}
                zohoIncome={regularIncome}
                stripeIncome={stripeNet}
                opexAmount={opexAmount}
                itbmAmount={itbmAmount}
                profitPercentage={profitPercentage}
                startingBalance={startingBalance}
                totalZohoExpenses={totalZohoExpenses}
              />
            </div>

            {/* Financial Summary with improved organization */}
            <FinanceSummary 
              summary={financialData.summary} 
              expenseCategories={financialData.expenseByCategory}
              stripeIncome={stripeIncome}
              stripeFees={stripeFees}
              stripeTransactionFees={stripeTransactionFees}
              stripePayoutFees={stripePayoutFees}
              stripeAdditionalFees={stripeAdditionalFees}
              stripeNet={stripeNet}
              stripeFeePercentage={stripeFeePercentage}
              regularIncome={regularIncome}
            />

            {/* Listado de transacciones */}
            <div className="mt-6">
              <TransactionList 
                transactions={financialData.transactions} 
                onRefresh={handleRefresh}
                isLoading={loading}
              />
            </div>
          </>
        )}

        {/* Sección de depuración */}
        <div className="mt-8 grid grid-cols-1 gap-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bug className="h-5 w-5 mr-2 text-amber-500" />
            Herramientas de depuración
          </h2>
          
          {/* Nuevo componente de depuración de Stripe */}
          <StripeDebug 
            dateRange={dateRange} 
            refreshDataFunction={refreshData}
          />
          
          {/* Componente de depuración de Webhook Zoho */}
          <WebhookDebug 
            dateRange={dateRange} 
            refreshDataFunction={refreshData}
            rawResponse={rawResponse}
          />
          
          {/* Componente de depuración de solicitud al webhook */}
          <WebhookRequestDebug dateRange={dateRange} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-center text-gray-500">
            Analizador Financiero para Agencias v1.0 • Datos obtenidos de Zoho Books y Stripe
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
