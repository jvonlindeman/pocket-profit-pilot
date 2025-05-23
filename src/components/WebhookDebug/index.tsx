
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { toFinancialDateRange } from '@/utils/dateRangeAdapter';
import WebhookDebugHeader from './WebhookDebugHeader';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import WebhookDataTable from './WebhookDataTable';
import WebhookRawData from './WebhookRawData';
import WebhookDataSummary from './WebhookDataSummary';

interface WebhookDebugProps {
  dateRange: DateRange;
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any; // This will now be the primary data source
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For UI state only - this doesn't trigger API calls
  const handleRefresh = async () => {
    if (loading || !refreshDataFunction) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use the central refresh function - we won't make a separate call here
      await refreshDataFunction(true);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("WebhookDebug: Failed to refresh data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-amber-500" />
          Depuración de Webhook
        </CardTitle>
        <CardDescription>
          Ver la respuesta cruda del webhook para detectar problemas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WebhookDebugHeader 
          loading={loading} 
          onFetchData={handleRefresh} 
        />

        {error && <WebhookErrorDisplay error={error} />}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}

        {rawResponse && !loading && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="formatted">Formateado</TabsTrigger>
              <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <WebhookDataSummary rawData={rawResponse} />
                <WebhookDataTable rawData={rawResponse} />
              </div>
            </TabsContent>
            
            <TabsContent value="raw" className="p-0">
              <WebhookRawData rawData={rawResponse} />
            </TabsContent>
          </Tabs>
        )}

        {!rawResponse && !loading && (
          <div className="border rounded-md p-4 mt-2 bg-gray-50 text-center text-gray-500">
            No hay datos disponibles. Presione "Refrescar Datos" para obtener información.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
