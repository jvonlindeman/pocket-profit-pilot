
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CreditCard, Calendar, AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StripeService from '@/services/stripeService';
import StripeDebugData from '@/components/WebhookDebug/StripeDebugData';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

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
  const [lastFetchedDateRange, setLastFetchedDateRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  // Function to format display dates
  const formatDisplayDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  // Function to check API connectivity
  const checkApiConnectivity = async () => {
    try {
      setLoading(true);
      console.log("StripeDebug: Checking API connectivity");
      
      const isConnected = await StripeService.checkApiConnectivity();
      setApiStatus(isConnected ? 'connected' : 'disconnected');
      
      console.log("StripeDebug: API connectivity check result:", isConnected);
      
      if (isConnected) {
        toast({
          title: "Stripe API Connectivity",
          description: "Successfully connected to Stripe API",
          variant: "success",
        });
      }
      
      setLoading(false);
      return isConnected;
    } catch (err) {
      console.error("Error checking API connectivity:", err);
      setApiStatus('disconnected');
      setLoading(false);
      
      toast({
        title: "Stripe API Error",
        description: "Failed to check Stripe API connectivity",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  // Function to fetch Stripe data
  const fetchStripeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check API connectivity
      const isConnected = await checkApiConnectivity();
      
      if (!isConnected) {
        setError("Unable to connect to Stripe API. Please check your API key configuration.");
        setLoading(false);
        return;
      }
      
      // Display toast notification
      toast({
        title: "Cargando datos de Stripe",
        description: `Periodo: ${formatDisplayDate(dateRange.startDate)} a ${formatDisplayDate(dateRange.endDate)}`,
      });
      
      // Use the global refresh function if available
      if (refreshDataFunction) {
        console.log("Using global refresh function to load data");
        refreshDataFunction(true);
        
        // Wait briefly for the update to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get Stripe data for the period
      try {
        console.log("StripeDebug: Fetching data for period", formatDisplayDate(dateRange.startDate), "to", formatDisplayDate(dateRange.endDate));
        
        // First check if there's any cached response
        let stripeData = StripeService.getLastRawResponse();
        
        // If no cached data exists, fetch it
        if (!stripeData) {
          console.log("No cached Stripe data, fetching from API");
          stripeData = await StripeService.getRawResponse(dateRange.startDate, dateRange.endDate, true);
        }
        
        // If we got data with a successful status code, clear any error state
        if (stripeData && !stripeData.error) {
          setError(null);
          setStripeRawData(stripeData);
          setLastFetchedDateRange({
            startDate: formatDisplayDate(dateRange.startDate),
            endDate: formatDisplayDate(dateRange.endDate)
          });
          
          console.log("Stripe debug data received:", stripeData);
          
          // Success toast
          toast({
            title: "Datos de Stripe cargados",
            description: `${stripeData?.transactions?.length || 0} transacciones encontradas`,
            variant: "success",
          });
        } else {
          // There's an error in the data
          const errorMsg = stripeData?.error || "Error desconocido al obtener datos de Stripe";
          setError(errorMsg);
          console.error("Error in Stripe data:", errorMsg);
          
          toast({
            title: "Error al cargar datos de Stripe",
            description: errorMsg,
            variant: "destructive",
          });
        }
      } catch (stripeErr: any) {
        console.error("Failed to fetch Stripe debug data:", stripeErr);
        setError(stripeErr.message || "Error desconocido al obtener datos de Stripe");
        setStripeRawData({ error: stripeErr.message || "Error desconocido al obtener datos de Stripe" });
        
        // Error toast
        toast({
          title: "Error al cargar datos de Stripe",
          description: stripeErr.message || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("Failed to fetch debug data:", err);
      
      // General error toast
      toast({
        title: "Error",
        description: err.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data and check connectivity on component mount
  useEffect(() => {
    // Check if we already have data cached
    const cachedData = StripeService.getLastRawResponse();
    if (cachedData) {
      setStripeRawData(cachedData);
    }
    
    // Check API connectivity
    checkApiConnectivity();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          Depuración de API Stripe
          
          {apiStatus === 'connected' && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Conectado
            </span>
          )}
          
          {apiStatus === 'disconnected' && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Desconectado
            </span>
          )}
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
          <div className="flex gap-2">
            <Button 
              onClick={checkApiConnectivity} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              Verificar conexión
            </Button>
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
        </div>

        {apiStatus === 'disconnected' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>
              No se pudo conectar a la API de Stripe. Verifica que la clave API esté configurada correctamente.
            </AlertDescription>
          </Alert>
        )}

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
      </CardContent>
    </Card>
  );
}
