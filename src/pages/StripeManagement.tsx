
import React from 'react';
import { ArrowLeftIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useFinanceData } from '@/hooks/useFinanceData';
import StripeTransactionManager from '@/components/Dashboard/StripeTransactionManager';
import TransactionList from '@/components/Dashboard/TransactionList';
import { useToast } from '@/hooks/use-toast';

const StripeManagement = () => {
  const {
    dateRange,
    financialData,
    loading,
    error,
    refreshData,
    stripeOverride,
  } = useFinanceData();
  
  const { toast } = useToast();
  
  // Filter for only Stripe transactions
  const stripeTransactions = financialData.transactions.filter(
    tx => tx.source === 'Stripe'
  );
  
  const handleRefresh = () => {
    toast({
      title: "Actualizando datos",
      description: "Obteniendo las últimas transacciones de Stripe...",
    });
    refreshData(true); // Force refresh to ensure we get the latest data
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Button variant="outline" size="sm" asChild className="mr-4">
              <Link to="/">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Ingresos Stripe</h1>
              <p className="mt-1 text-sm text-gray-500">
                Añade y gestiona transacciones de Stripe manualmente
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StripeTransactionManager 
          onTransactionAdded={handleRefresh}
          currentDate={dateRange.startDate}
          stripeOverride={stripeOverride}
        />
        
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Transacciones de Stripe
            </h2>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
          
          <TransactionList 
            transactions={stripeTransactions}
            isLoading={loading}
            onRefresh={handleRefresh}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>
      </main>
    </div>
  );
};

export default StripeManagement;
