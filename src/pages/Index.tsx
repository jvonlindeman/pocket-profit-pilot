
import React, { useEffect } from 'react';
import DateRangePicker from '@/components/Dashboard/DateRangePicker';
import FinanceSummary from '@/components/Dashboard/FinanceSummary';
import RevenueChart from '@/components/Dashboard/RevenueChart';
import ExpenseChart from '@/components/Dashboard/ExpenseChart';
import ProfitAnalysis from '@/components/Dashboard/ProfitAnalysis';
import TransactionList from '@/components/Dashboard/TransactionList';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const {
    dateRange,
    updateDateRange,
    financialData,
    loading,
    error,
    getCurrentMonthRange,
    refreshData
  } = useFinanceData();
  
  const { toast } = useToast();

  // Efecto para cargar datos iniciales y mostrar notificación
  useEffect(() => {
    console.log("Index component mounted, initial data load");
    
    // Mostrar toast de bienvenida
    toast({
      title: 'Cargando datos financieros',
      description: 'Obteniendo datos de Zoho Books y Stripe',
    });
  }, []);

  // Logs para depuración
  useEffect(() => {
    if (financialData) {
      console.log("Financial data updated:", {
        totalIncome: financialData.summary.totalIncome,
        totalExpense: financialData.summary.totalExpense,
        profit: financialData.summary.profit,
        transactionCount: financialData.transactions.length
      });
    }
  }, [financialData]);

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

  // Manejador para actualizar datos
  const handleRefresh = () => {
    console.log("Manual refresh requested");
    toast({
      title: 'Actualizando datos',
      description: 'Obteniendo datos más recientes...',
    });
    refreshData(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabecera del Dashboard */}
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
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-finance-profit"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p>{error}</p>
            <Button variant="outline" className="mt-2" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
            </Button>
          </div>
        ) : (
          <>
            {/* Periodo y botón de actualización */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">
                Periodo: <span className="text-gray-900">{periodTitle}</span>
              </h2>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
              </Button>
            </div>

            {/* Información de depuración */}
            {financialData.transactions.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
                <p className="font-medium">No hay transacciones para el periodo seleccionado.</p>
                <p className="mt-1 text-sm">Intenta seleccionar un periodo diferente o verificar la configuración de Zoho Books.</p>
              </div>
            )}

            {/* Resumen financiero */}
            <FinanceSummary 
              summary={financialData.summary} 
              expenseCategories={financialData.expenseByCategory} 
            />

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <RevenueChart 
                incomeData={financialData.dailyData.income} 
                expenseData={financialData.dailyData.expense} 
              />
              <ExpenseChart expenseData={financialData.expenseByCategory} />
            </div>

            {/* Análisis de rentabilidad */}
            <div className="mt-6">
              <ProfitAnalysis monthlyData={financialData.monthlyData} />
            </div>

            {/* Listado de transacciones */}
            <div className="mt-6">
              <TransactionList transactions={financialData.transactions} />
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
