
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useDebugComponent } from '@/hooks/useDebugComponent';
import StripeDebugData from '@/components/WebhookDebug/StripeDebugData';

interface StripeDebugProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshDataFunction?: (forceRefresh: boolean) => Promise<boolean> | void;
  stripeRawData?: any;
}

export default function StripeDebug({ dateRange, refreshDataFunction, stripeRawData }: StripeDebugProps) {
  // Use our shared hook for common debug functionality
  const { 
    loading, 
    error, 
    lastRefreshed,
    handleRefresh 
  } = useDebugComponent({
    componentName: 'Stripe',
    refreshFunction: refreshDataFunction,
    dateRange
  });
  
  // Format display dates
  const formatDisplayDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  // Prepare last fetched date range display
  const lastFetchedDateRange = lastRefreshed ? {
    startDate: formatDisplayDate(dateRange.startDate),
    endDate: formatDisplayDate(dateRange.endDate)
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          Depuración de API Stripe
        </CardTitle>
        <CardDescription>
          Ver la respuesta cruda de la API Stripe para este periodo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Periodo: {formatDisplayDate(dateRange.startDate)} a {formatDisplayDate(dateRange.endDate)}
            </span>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Cargar Datos de Stripe</>
            )}
          </Button>
        </div>

        {lastFetchedDateRange && (
          <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-lg p-2 mb-4 text-xs">
            Última actualización: Periodo del {lastFetchedDateRange.startDate} al {lastFetchedDateRange.endDate}
            {lastRefreshed && ` (${lastRefreshed.toLocaleTimeString()})`}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {stripeRawData && !loading && (
          <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
            <StripeDebugData rawData={stripeRawData} />
          </div>
        )}
        
        {!stripeRawData && !loading && (
          <div className="border rounded-md p-4 mt-2 bg-gray-50 text-center text-gray-500">
            No hay datos disponibles. Presione "Cargar Datos de Stripe" para obtener información.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
