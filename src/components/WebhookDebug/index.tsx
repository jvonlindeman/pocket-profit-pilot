
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';
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
  rawResponse?: any;
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  const [loading, setLoading] = useState(false);
  const [localRawData, setLocalRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Use the rawResponse from props when available
  React.useEffect(() => {
    if (rawResponse && !localRawData) {
      console.log("WebhookDebug: Using rawResponse from props");
      setLocalRawData(rawResponse);
    }
  }, [rawResponse, localRawData]);

  // Display data - prioritize local data if available, otherwise use props
  const displayData = localRawData || rawResponse;

  // Function to fetch raw webhook data - only called when user explicitly requests it
  const fetchDebugData = async () => {
    // Don't fetch if we're already loading
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First update data using the global refresh function if available
      if (refreshDataFunction) {
        console.log("WebhookDebug: Using global refresh function to load data");
        refreshDataFunction(true);
        
        // Wait a brief moment for the update to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // If we have data via props after refresh, use that
        if (rawResponse) {
          console.log("WebhookDebug: Using rawResponse from props after refresh");
          setLocalRawData(rawResponse);
          setLoading(false);
          return;
        }
      }
      
      // If we still need to fetch data ourselves
      console.log("WebhookDebug: Fetching data directly");
      const financialDateRange = toFinancialDateRange(dateRange);
      
      // Get raw data directly to show in the debug UI
      const data = await ZohoService.getRawResponse(
        financialDateRange.startDate, 
        financialDateRange.endDate,
        true // Force refresh to bypass even in-memory cache
      );
      setLocalRawData(data);
      console.log("WebhookDebug: Debug data received", data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("WebhookDebug: Failed to fetch debug data:", err);
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
          onFetchData={fetchDebugData} 
        />

        {error && <WebhookErrorDisplay error={error} />}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}

        {displayData && !loading && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="formatted">Formateado</TabsTrigger>
              <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <WebhookDataSummary rawData={displayData} />
                <WebhookDataTable rawData={displayData} />
              </div>
            </TabsContent>
            
            <TabsContent value="raw" className="p-0">
              <WebhookRawData rawData={displayData} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
