
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StripeService from '@/services/stripeService';
import StripeDebugData from '@/components/WebhookDebug/StripeDebugData';

interface StripeDebugProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshDataFunction?: (forceRefresh: boolean) => void;
}

export default function StripeDebug({ dateRange, refreshDataFunction }: StripeDebugProps) {
  const [loading, setLoading] = useState(false);
  const [stripeRawData, setStripeRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Función para obtener los datos de Stripe
  const fetchStripeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the global refresh function if available
      if (refreshDataFunction) {
        console.log("Usando la función de actualización global para cargar datos");
        refreshDataFunction(true);
        
        // Wait briefly for the update to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get Stripe data for the period
      try {
        // First check if there's any cached response
        let stripeData = StripeService.getLastRawResponse();
        
        // If no cached data exists, fetch it
        if (!stripeData) {
          console.log("No cached Stripe data, fetching from API");
          await StripeService.getTransactions(dateRange.startDate, dateRange.endDate);
          stripeData = StripeService.getLastRawResponse();
        }
        
        setStripeRawData(stripeData);
        console.log("Stripe debug data received:", stripeData);
      } catch (stripeErr: any) {
        console.error("Failed to fetch Stripe debug data:", stripeErr);
        setError(stripeErr.message || "Error desconocido al obtener datos de Stripe");
        setStripeRawData({ error: stripeErr.message || "Error desconocido al obtener datos de Stripe" });
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("Failed to fetch debug data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount if needed
  useEffect(() => {
    // Check if we already have data cached
    const cachedData = StripeService.getLastRawResponse();
    if (cachedData) {
      setStripeRawData(cachedData);
    }
  }, []);

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
          <p className="text-sm text-muted-foreground">
            Datos de transacciones de Stripe para el periodo actual
          </p>
          <Button 
            onClick={fetchStripeData} 
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
      </CardContent>
    </Card>
  );
}
