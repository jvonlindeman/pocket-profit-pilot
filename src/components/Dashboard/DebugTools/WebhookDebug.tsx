
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug, AlertTriangle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useDebugComponent } from '@/hooks/useDebugComponent';
import WebhookDebugHeader from '@/components/WebhookDebug/WebhookDebugHeader';
import WebhookErrorDisplay from '@/components/WebhookDebug/WebhookErrorDisplay';
import WebhookDataTable from '@/components/WebhookDebug/WebhookDataTable';
import WebhookRawData from '@/components/WebhookDebug/WebhookRawData';
import WebhookDataSummary from '@/components/WebhookDebug/WebhookDataSummary';

interface WebhookDebugProps {
  dateRange: DateRange;
  refreshDataFunction?: (forceRefresh: boolean) => Promise<boolean> | void;
  rawResponse?: any;
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  // Use our shared hook for common debug functionality
  const { 
    loading, 
    error, 
    handleRefresh 
  } = useDebugComponent({
    componentName: 'Webhook',
    refreshFunction: refreshDataFunction,
    dateRange: {
      startDate: dateRange.from || new Date(), 
      endDate: dateRange.to || new Date()
    }
  });

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
        
        {/* Warning sobre llamadas múltiples */}
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <div className="text-sm text-amber-800">
            <strong>Nota:</strong> Se han implementado mejoras para prevenir llamadas duplicadas al webhook. 
            Las peticiones están ahora protegidas con deduplicación automática.
          </div>
        </div>
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
