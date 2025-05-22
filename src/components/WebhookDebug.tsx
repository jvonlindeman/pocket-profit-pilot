import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bug } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';
import { formatDateYYYYMMDD } from '@/utils/dateUtils';

// Import our new components
import FormattedDataTab from './WebhookDebug/FormattedDataTab';
import CollaboratorsTab from './WebhookDebug/CollaboratorsTab';
import InvoicesTab from './WebhookDebug/InvoicesTab';
import RawDataTab from './WebhookDebug/RawDataTab';

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

  // When rawResponse changes from the parent component, update our local state
  useEffect(() => {
    if (rawResponse) {
      setRawData(rawResponse);
      console.log("WebhookDebug: Received rawResponse from parent:", rawResponse);
    }
  }, [rawResponse]);

  // Function to fetch raw webhook data
  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First update data using the global refresh function
      if (refreshDataFunction) {
        console.log("Using global refresh function to load data");
        refreshDataFunction(true);
        
        // Wait a brief moment for the update to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we already have data via the rawResponse prop
        if (rawResponse) {
          setRawData(rawResponse);
          setLoading(false);
          return;
        }
      }
      
      // Otherwise, get raw data directly to show in the debug UI
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
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Esta herramienta te permite ver la respuesta sin procesar del webhook de make.com
          </p>
          <Button 
            onClick={fetchDebugData} 
            variant="outline" 
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Cargar Datos</>
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

        {rawData && !loading && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-4 w-[400px]">
              <TabsTrigger value="formatted">Formateado</TabsTrigger>
              <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
              <TabsTrigger value="invoices">Facturas Pendientes</TabsTrigger>
              <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted">
              <FormattedDataTab rawData={rawData} />
            </TabsContent>
            
            <TabsContent value="collaborators">
              <CollaboratorsTab collaborators={rawData?.colaboradores || []} />
            </TabsContent>
            
            <TabsContent value="invoices">
              <InvoicesTab invoices={rawData?.facturas_sin_pagar || []} />
            </TabsContent>
            
            <TabsContent value="raw">
              <RawDataTab rawData={rawData} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
