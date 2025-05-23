
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StripeDebugData from '@/components/WebhookDebug/StripeDebugData';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface StripeDebugProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshDataFunction?: (forceRefresh: boolean) => void;
  // Add a new prop for raw stripe data
  stripeRawData?: any;
}

export default function StripeDebug({ dateRange, refreshDataFunction, stripeRawData }: StripeDebugProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedDateRange, setLastFetchedDateRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  
  // Function to format display dates
  const formatDisplayDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  useEffect(() => {
    if (stripeRawData) {
      setLastFetchedDateRange({
        startDate: formatDisplayDate(dateRange.startDate),
        endDate: formatDisplayDate(dateRange.endDate)
      });
    }
  }, [stripeRawData, dateRange]);

  // Handle refresh button click - uses the centralized refresh function
  const handleRefresh = async () => {
    if (loading || !refreshDataFunction) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Display toast notification
      toast({
        title: "Cargando datos de Stripe",
        description: `Periodo: ${formatDisplayDate(dateRange.startDate)} a ${formatDisplayDate(dateRange.endDate)}`,
      });
      
      // Use the centralized refresh function from parent
      await refreshDataFunction(true);
      
      // Success toast
      toast({
        title: "Datos de Stripe cargados",
        description: stripeRawData?.transactions?.length 
          ? `${stripeRawData.transactions.length} transacciones encontradas` 
          : "Datos actualizados",
        variant: "success",
      });
      
      setLastFetchedDateRange({
        startDate: formatDisplayDate(dateRange.startDate),
        endDate: formatDisplayDate(dateRange.endDate)
      });
    } catch (err: any) {
      console.error("Failed to fetch Stripe debug data:", err);
      setError(err.message || "Error desconocido al obtener datos de Stripe");
      
      // Error toast
      toast({
        title: "Error al cargar datos de Stripe",
        description: err.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
