import React from 'react';
import ZohoDebug from '@/components/ZohoDebug';
import WebhookDebug from '@/components/WebhookDebug/index';
import StripeDebug from '@/components/StripeDebug';
import CacheClearTool from '@/components/Dashboard/CacheClearTool';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug } from 'lucide-react';
import { Link } from 'react-router-dom';
import { endOfMonth, startOfMonth } from 'date-fns';

const Settings = () => {
  // Create a date range for the current month
  const today = new Date();
  const dateRange = {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
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
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Bug className="h-5 w-5 mr-2" />
              Herramientas de Depuración
            </h2>
            
            {/* Cache Clear Tool */}
            <CacheClearTool />
            
            {/* Existing Debug Tools */}
            <ZohoDebug />
            <div className="mt-6">
              <StripeDebug dateRange={dateRange} />
            </div>
            <div className="mt-6">
              <WebhookDebug dateRange={dateRange} />
            </div>
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
