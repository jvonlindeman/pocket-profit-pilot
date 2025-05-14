
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bug, RefreshCw, WifiOff } from 'lucide-react';
import ZohoService from '@/services/zohoService';
import WebhookDebugHeader from './WebhookDebugHeader';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import WebhookDataSummary from './WebhookDataSummary';
import WebhookDataTable from './WebhookDataTable';
import WebhookRawData from './WebhookRawData';
import { Button } from '@/components/ui/button';

interface WebhookDebugProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any;
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(true);

  // Update local state when rawResponse from parent changes
  useEffect(() => {
    if (rawResponse) {
      setRawData(rawResponse);
      console.log("WebhookDebug: Received rawResponse from parent:", rawResponse);
    }
  }, [rawResponse]);

  // Check API connectivity on component mount
  useEffect(() => {
    async function checkConnectivity() {
      const isConnected = await ZohoService.checkApiConnectivity();
      setApiConnected(isConnected);
    }
    checkConnectivity();
  }, []);

  // Fetch debug data from API
  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check connectivity first
      const isConnected = await ZohoService.checkApiConnectivity();
      setApiConnected(isConnected);
      
      if (!isConnected) {
        setError("Cannot connect to Zoho API. Please check your credentials and network connection.");
        setLoading(false);
        return;
      }
      
      // Use the global refresh function if available
      if (refreshDataFunction) {
        console.log("Usando la función de actualización global para cargar datos");
        refreshDataFunction(true);
        
        // Wait briefly for the update to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we already have data through the rawResponse prop
        if (rawResponse) {
          setRawData(rawResponse);
        }
      }
      
      // Get raw data directly if not updated through the rawResponse prop
      if (!rawResponse) {
        const data = await ZohoService.getRawResponse(dateRange.startDate, dateRange.endDate);
        setRawData(data);
        console.log("Debug data received:", data);
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("Failed to fetch debug data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Attempt cache repair
  const repairCache = async () => {
    setLoading(true);
    try {
      const repaired = await ZohoService.repairCache(dateRange.startDate, dateRange.endDate);
      if (repaired) {
        setError(null);
      } else {
        setError("Cache repair attempt completed but no issues were found or repair failed.");
      }
    } catch (err: any) {
      setError(err.message || "Error attempting to repair cache");
      console.error("Failed to repair cache:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-amber-500" />
          Depuración de Webhook Zoho
          {!apiConnected && (
            <WifiOff className="h-5 w-5 ml-2 text-red-500" title="API Disconnected" />
          )}
        </CardTitle>
        <CardDescription>
          Ver la respuesta cruda del webhook para detectar problemas
          {!apiConnected && (
            <span className="text-red-500 block mt-1">
              No se puede conectar a la API de Zoho. Verificando estado de caché.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <WebhookDebugHeader loading={loading} onFetchData={fetchDebugData} />
          
          {!apiConnected && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={repairCache} 
              disabled={loading}
              className="ml-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reparando...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Intentar Reparar Caché</>
              )}
            </Button>
          )}
        </div>
        
        <WebhookErrorDisplay error={error} />

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {rawData && !loading && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="formatted">Formateado</TabsTrigger>
              <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <WebhookDataSummary rawData={rawData} />
                <WebhookDataTable rawData={rawData} />
              </div>
            </TabsContent>
            
            <TabsContent value="raw" className="p-0">
              <WebhookRawData rawData={rawData} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
