
import React, { useState } from 'react';
import DateRangePicker from '@/components/Dashboard/DateRangePicker';
import FinanceSummary from '@/components/Dashboard/FinanceSummary/index';
import RevenueChart from '@/components/Dashboard/RevenueChart';
import ExpenseChart from '@/components/Dashboard/ExpenseChart';
import CollaboratorChart from '@/components/Dashboard/CollaboratorChart';
import ProfitAnalysis from '@/components/Dashboard/ProfitAnalysis';
import TransactionList from '@/components/Dashboard/TransactionList';
import MonthlyBalanceEditor from '@/components/Dashboard/MonthlyBalanceEditor';
import InitialBalanceDialog from '@/components/Dashboard/InitialBalanceDialog';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, Bug, Play, RotateCw, Database, DollarSign, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import WebhookDebug from '@/components/WebhookDebug';
import WebhookRequestDebug from '@/components/WebhookRequestDebug';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import ZohoDebug from '@/components/ZohoDebug';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ZohoService from '@/services/zohoService';

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
    stripeOverride
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

  // Prepare Stripe data for chart
  const getStripeDataForChart = () => {
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
      
      {/* Cabecera del Dashboard */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analizador Financiero</h1>
              <p className="mt-1 text-sm text-gray-500">Análisis de ingresos y gastos para tu agencia</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/stripe-management">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Gestión Stripe
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={toggleDebugMode}>
                  <Bug className="h-4 w-4 mr-2" />
                  {debugMode ? 'Ocultar Debug' : 'Mostrar Debug'}
                </Button>
              </div>
              <div className="w-full md:w-64">
                <DateRangePicker
                  dateRange={dateRange}
                  onRangeChange={updateDateRange}
                  getCurrentMonthRange={getCurrentMonthRange}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
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
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
              </Button>
              <Button variant="outline" onClick={handleForceRefresh}>
                <RotateCw className="h-4 w-4 mr-2" /> Forzar actualización
              </Button>
              <Button variant="outline" onClick={handleClearCacheAndRefresh}>
                <Trash2 className="h-4 w-4 mr-2" /> Limpiar caché y actualizar
              </Button>
            </div>
          </div>
        )}
        
        {dataInitialized && !loading && !error && (
          <>
            {/* Debugging information */}
            {debugMode && (
              <Alert variant="default" className="bg-amber-50 border-amber-200 mb-6">
                <Bug className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700">Información de depuración</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Stripe Income:</span> ${stripeIncome.toFixed(2)}
                      {stripeOverride !== null && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 rounded">Override</span>
                      )}
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Regular Income:</span> ${regularIncome.toFixed(2)}
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Total Income:</span> ${financialData.summary.totalIncome.toFixed(2)}
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Total Expense:</span> ${financialData.summary.totalExpense.toFixed(2)}
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Collaborator Expense:</span> ${(financialData.summary.collaboratorExpense || 0).toFixed(2)}
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Other Expense:</span> ${(financialData.summary.otherExpense || 0).toFixed(2)}
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Profit:</span> ${financialData.summary.profit.toFixed(2)}
                    </div>
                    <div className="bg-white p-2 rounded border border-amber-100">
                      <span className="font-semibold">Starting Balance:</span> ${(financialData.summary.startingBalance || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={handleClearCacheAndRefresh} className="text-amber-700 border-amber-300 hover:bg-amber-100">
                      <Trash2 className="h-4 w-4 mr-2" /> Limpiar caché y forzar actualización
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Periodo y botones de actualización */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">
                Periodo: <span className="text-gray-900">{periodTitle}</span>
              </h2>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Actualizar usando caché cuando esté disponible</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleForceRefresh}>
                        <RotateCw className="h-4 w-4 mr-2" /> Forzar actualización
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ignorar caché y obtener datos frescos de la API</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleClearCacheAndRefresh}>
                        <Trash2 className="h-4 w-4 mr-2" /> Limpiar caché
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Limpiar caché y obtener datos completamente nuevos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Indicador de caché */}
            {usingCachedData && !partialRefresh && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-2 text-sm mb-6">
                <p className="font-medium flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" /> 
                  Usando datos en caché. Para datos completamente actualizados, use "Forzar actualización".
                </p>
              </div>
            )}

            {/* Indicador de refresco parcial */}
            {partialRefresh && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-2 text-sm mb-6">
                <p className="font-medium flex items-center">
                  <Database className="h-4 w-4 mr-2" /> 
                  Actualización parcial: se usó caché para datos existentes y se obtuvieron solo los datos nuevos.
                  {cacheStats && (
                    <Badge variant="outline" className="ml-2 bg-white border-green-200">
                      {cacheStats.newCount} nuevas transacciones
                    </Badge>
                  )}
                </p>
              </div>
            )}

            {/* Información de depuración */}
            {financialData.transactions.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
                <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
                <p className="mt-1 text-sm">Intenta seleccionar un periodo diferente o verificar la configuración de Zoho Books.</p>
              </div>
            )}

            {/* Balance Mensual Inicial */}
            <div className="mb-6">
              <MonthlyBalanceEditor currentDate={dateRange.startDate} />
            </div>

            {/* Resumen financiero */}
            <FinanceSummary 
              summary={financialData.summary} 
              expenseCategories={financialData.expenseByCategory}
              stripeIncome={stripeIncome}
              regularIncome={regularIncome}
              stripeOverride={stripeOverride}
            />

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <RevenueChart 
                incomeData={financialData.dailyData.income} 
                expenseData={financialData.dailyData.expense}
                stripeData={getStripeDataForChart()}
              />
              <ExpenseChart expenseData={financialData.expenseByCategory} />
            </div>

            {/* Nuevo gráfico de colaboradores */}
            {collaboratorExpenses && collaboratorExpenses.length > 0 && (
              <div className="mt-6">
                <CollaboratorChart collaboratorData={collaboratorExpenses} />
              </div>
            )}

            {/* Análisis de rentabilidad */}
            <div className="mt-6">
              <ProfitAnalysis monthlyData={financialData.monthlyData} />
            </div>

            {/* Listado de transacciones */}
            <div className="mt-6">
              <TransactionList 
                transactions={financialData.transactions} 
                onRefresh={handleRefresh}
                isLoading={loading}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </div>
          </>
        )}

        {/* Zoho Debug componente mejorado */}
        <div className="mt-8">
          <ZohoDebug />
        </div>

        {/* Sección de depuración del webhook - solo mostrar en modo debug */}
        {debugMode && (
          <>
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bug className="h-5 w-5 mr-2 text-amber-500" />
                Depuración del Webhook
              </h2>
              <div className="mt-2">
                <WebhookDebug 
                  dateRange={dateRange} 
                  refreshDataFunction={refreshData}
                  rawResponse={rawResponse}
                />
              </div>
              
              {/* Componente de depuración de solicitud al webhook */}
              <div className="mt-6">
                <WebhookRequestDebug dateRange={dateRange} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Pie de página */}
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
