
import React from 'react';
import CacheClearTool from '@/components/Dashboard/CacheClearTool';
import CacheMonitor from '@/components/Dashboard/CacheMonitor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { endOfMonth, startOfMonth } from 'date-fns';
import DebugSection from '@/components/Dashboard/DebugTools/DebugSection';
import { toDayPickerDateRange } from '@/utils/dateRangeAdapter'; // Keep this import

const Settings = () => {
  // Create a date range for the current month
  const today = new Date();
  const financialDateRange = {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  };
  
  // Convert to DayPicker DateRange format for components that expect it
  const dayPickerDateRange = toDayPickerDateRange(financialDateRange);

  // Simple refresh function to pass to debug components
  const refreshData = (force: boolean) => {
    console.log('Settings page refresh triggered with force:', force);
    // This is just a stub - the actual refresh happens inside the DebugSection component
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
          
          {/* Use the centralized DebugSection component */}
          <DebugSection 
            dateRange={financialDateRange}
            refreshData={refreshData}
            rawResponse={null} // Initially null, it will be populated by the component
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
