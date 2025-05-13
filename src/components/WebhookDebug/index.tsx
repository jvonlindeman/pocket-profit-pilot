
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bug } from 'lucide-react';
import ZohoService from '@/services/zohoService';
import StripeService from '@/services/stripeService';
import WebhookDebugHeader from './WebhookDebugHeader';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import WebhookDataSummary from './WebhookDataSummary';
import WebhookDataTable from './WebhookDataTable';
import WebhookRawData from './WebhookRawData';
import StripeDebugData from './StripeDebugData';

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
  const [stripeRawData, setStripeRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Update local state when rawResponse from parent changes
  useEffect(() => {
    if (rawResponse) {
      setRawData(rawResponse);
      console.log("WebhookDebug: Received rawResponse from parent:", rawResponse);
    }
  }, [rawResponse]);

  // Fetch debug data from API
  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
      
      // Also get Stripe data for the same period
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
        // Don't set the main error - we'll just show this in the Stripe tab
        setStripeRawData({ error: stripeErr.message || "Error desconocido al obtener datos de Stripe" });
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("Failed to fetch debug data:", err);
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
        </CardTitle>
        <CardDescription>
          Ver la respuesta cruda del webhook para detectar problemas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WebhookDebugHeader loading={loading} onFetchData={fetchDebugData} />
        <WebhookErrorDisplay error={error} />

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {(rawData || stripeRawData) && !loading && (
          <Tabs defaultValue="zoho" className="w-full">
            <TabsList className="grid grid-cols-3 w-[300px]">
              <TabsTrigger value="zoho">Zoho Webhook</TabsTrigger>
              <TabsTrigger value="stripe">Stripe API</TabsTrigger>
              <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
            </TabsList>
            <TabsContent value="zoho" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <WebhookDataSummary rawData={rawData} />
                <WebhookDataTable rawData={rawData} />
              </div>
            </TabsContent>
            <TabsContent value="stripe" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <StripeDebugData rawData={stripeRawData} />
              </div>
            </TabsContent>
            <TabsContent value="raw" className="p-0">
              <Tabs defaultValue="zoho-raw" className="w-full">
                <TabsList className="grid grid-cols-2 w-[200px] mb-2">
                  <TabsTrigger value="zoho-raw">Zoho</TabsTrigger>
                  <TabsTrigger value="stripe-raw">Stripe</TabsTrigger>
                </TabsList>
                
                <TabsContent value="zoho-raw" className="p-0">
                  <WebhookRawData rawData={rawData} />
                </TabsContent>
                
                <TabsContent value="stripe-raw" className="p-0">
                  <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {stripeRawData ? JSON.stringify(stripeRawData, null, 2) : 'No stripe data available'}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
