
import React, { useState, useEffect } from 'react';
import CacheClearTool from '@/components/Dashboard/CacheClearTool';
import CacheMonitor from '@/components/Dashboard/CacheMonitor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { endOfMonth, startOfMonth } from 'date-fns';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';
import { dataFetcherService } from '@/services/dataFetcherService';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  // Create a date range for the current month
  const today = new Date();
  const financialDateRange = {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  };
  
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch data on component mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Check API status for debugging purposes
  const checkApiStatus = async () => {
    try {
      const connectivity = await dataFetcherService.checkApiConnectivity();
      console.log('API Connectivity Status:', connectivity);
    } catch (error) {
      console.error('Error checking API status:', error);
    }
  };

  // Settings page refresh function that uses the centralized data fetcher
  const refreshData = async (force: boolean = false) => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      toast({
        title: "Actualizando datos",
        description: "Obteniendo datos desde los servicios externos...",
      });
      
      // Use the centralized data fetcher service
      const success = await dataFetcherService.fetchAllFinancialData(
        financialDateRange,
        force,
        {
          // No callbacks necessary for settings page
        }
      );
      
      // Get the raw response for debugging
      const response = dataFetcherService.getLastRawResponse();
      setRawResponse(response);
      
      toast({
        title: success ? "Datos actualizados" : "Error al actualizar",
        description: success 
          ? "Los datos se han actualizado correctamente" 
          : "No se pudieron obtener todos los datos",
        variant: success ? "success" : "destructive",
      });
      
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error al actualizar",
        description: "Se produjo un error al obtener los datos",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Herramientas de Depuración</h1>
              <p className="mt-1 text-sm text-gray-500">Funciones para solucionar problemas</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="outline" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <section className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-500" />
              Gestión de Caché
            </h2>
            
            {/* Cache Monitor */}
            <CacheMonitor />
            
            {/* Cache Clear Tool */}
            <div className="mt-4">
              <CacheClearTool />
            </div>
          </section>
          
          {/* Use the centralized DebugSection component with our new refreshData function */}
          <DebugSection 
            dateRange={financialDateRange}
            refreshData={refreshData}
            rawResponse={rawResponse}
          />
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

export default Settings;
