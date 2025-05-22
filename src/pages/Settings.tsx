import React from 'react';
import ZohoDebug from '@/components/ZohoDebug';
import WebhookDebug from '@/components/WebhookDebug';
import StripeDebug from '@/components/StripeDebug';
import CacheClearTool from '@/components/Dashboard/CacheClearTool';
import CacheMonitor from '@/components/Dashboard/CacheMonitor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { endOfMonth, startOfMonth } from 'date-fns';
import ZohoConfig from '@/components/ZohoConfig';
import { toDayPickerDateRange } from '@/utils/dateRangeAdapter';
import { DateRange } from 'react-day-picker';

const Settings = () => {
  // Create a date range for the current month
  const today = new Date();
  const financialDateRange = {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  };
  
  // Convert to DayPicker DateRange format for components that expect it
  const dayPickerDateRange: DateRange = toDayPickerDateRange(financialDateRange);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
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
      </div>

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
          
          <section className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Bug className="h-5 w-5 mr-2 text-amber-500" />
              Herramientas de Depuración
            </h2>
            
            {/* Existing Debug Tools */}
            <ZohoDebug />
            <div className="mt-6">
              <StripeDebug dateRange={financialDateRange} />
            </div>
            <div className="mt-6">
              {/* Pass the correct date range format to WebhookDebug */}
              <WebhookDebug dateRange={dayPickerDateRange} />
            </div>
          </section>
          
          <section className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Configuración
            </h2>
            <ZohoConfig />
          </section>
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
