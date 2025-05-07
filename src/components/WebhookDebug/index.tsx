
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bug } from 'lucide-react';
import ZohoService from '@/services/zohoService';
import WebhookDebugHeader from './WebhookDebugHeader';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import WebhookDataSummary from './WebhookDataSummary';
import WebhookDataTable from './WebhookDataTable';
import WebhookRawData from './WebhookRawData';

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
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Update local state when rawResponse from parent changes
  useEffect(() => {
    if (rawResponse) {
      setRawData(rawResponse);
      console.log("WebhookDebug: Received rawResponse from parent:", rawResponse);
    }
    
    // Get cache statistics
    const stats = ZohoService.getCacheStats();
    setCacheStats(stats);
  }, [rawResponse]);

  // Fetch debug data from API
  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get cache statistics
      const stats = ZohoService.getCacheStats();
      setCacheStats(stats);
      
      // Use the global refresh function if available
      if (refreshDataFunction) {
        console.log("Usando la función de actualización global para cargar datos");
        refreshDataFunction(true);
        
        // Wait briefly for the update to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we already have data through the rawResponse prop
        if (rawResponse) {
          setRawData(rawResponse);
          setLoading(false);
          return;
        }
      }
      
      // Get raw data directly if not updated through the rawResponse prop
      const data = await ZohoService.getRawResponse(dateRange.startDate, dateRange.endDate);
      setRawData(data);
      console.log("Debug data received:", data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("Failed to fetch debug data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Additional function to check cached transaction count
  const checkCacheCount = async () => {
    try {
      const count = await ZohoService.getCachedTransactionCount(
        dateRange.startDate,
        dateRange.endDate
      );
      
      console.log(`WebhookDebug: Found ${count} cached transactions for date range`);
      
      if (count === 0) {
        setError(`No cached transactions found for date range ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`);
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error("Error checking cache count:", err);
    }
  };

  // Call checkCacheCount when dateRange changes
  useEffect(() => {
    checkCacheCount();
  }, [dateRange.startDate, dateRange.endDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-amber-500" />
          Depuración de Webhook Zoho
        </CardTitle>
        <CardDescription>
          Ver la respuesta cruda del webhook para detectar problemas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WebhookDebugHeader loading={loading} onFetchData={fetchDebugData} />
        <WebhookErrorDisplay error={error} />

        {cacheStats && (
          <div className="text-xs text-gray-500 mb-2 bg-gray-100 p-2 rounded-md">
            <div className="font-semibold">Estado del caché:</div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>Aciertos: {cacheStats.hits}</div>
              <div>Fallos: {cacheStats.misses}</div>
              <div>Tasa de aciertos: {cacheStats.hitRate}</div>
              <div>Errores: {cacheStats.errors}</div>
              <div>Rangos en caché: {cacheStats.cachedRangeCount}</div>
              <div>Última actualización: {cacheStats.lastRefreshRelative}</div>
            </div>
          </div>
        )}

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
