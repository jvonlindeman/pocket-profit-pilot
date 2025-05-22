
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Webhook, RefreshCcw, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { zohoRepository } from '@/repositories/zohoRepository';
import InvoicesTab from './InvoicesTab';

interface WebhookDebugProps {
  dateRange: { startDate: Date; endDate: Date };
  refreshDataFunction: (force: boolean) => void;
  rawResponse: any;
}

const WebhookDebug: React.FC<WebhookDebugProps> = ({ 
  dateRange, 
  refreshDataFunction,
  rawResponse
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  
  // Fetch debug data from Zoho
  const fetchDebugData = async () => {
    setLoading(true);
    try {
      // Get raw data for debugging purposes
      const data = await zohoRepository.getRawResponse(dateRange.startDate, dateRange.endDate);
      
      if (data && data.facturas_sin_pagar && Array.isArray(data.facturas_sin_pagar)) {
        console.log("WebhookDebug: Received unpaid invoices:", data.facturas_sin_pagar.length);
        setUnpaidInvoices(data.facturas_sin_pagar);
        toast({
          title: "Datos cargados",
          description: `Se encontraron ${data.facturas_sin_pagar.length} facturas sin pagar`,
        });
      } else {
        console.warn("WebhookDebug: No unpaid invoices found in response");
        setUnpaidInvoices([]);
        toast({
          title: "Advertencia",
          description: "No se encontraron facturas sin pagar en la respuesta",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error("Error fetching debug data:", error);
      toast({
        title: "Error",
        description: "Error al cargar datos del webhook",
        variant: "destructive"
      });
      setUnpaidInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data from the existing rawResponse prop if available
  useEffect(() => {
    if (rawResponse && rawResponse.facturas_sin_pagar && Array.isArray(rawResponse.facturas_sin_pagar)) {
      console.log("WebhookDebug: Using facturas_sin_pagar from rawResponse:", rawResponse.facturas_sin_pagar.length);
      setUnpaidInvoices(rawResponse.facturas_sin_pagar);
    } else {
      console.log("WebhookDebug: No unpaid invoices in rawResponse, fetching...");
      fetchDebugData();
    }
  }, [rawResponse]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center">
              <Webhook className="h-4 w-4 mr-1 text-blue-500" />
              Webhook Zoho
            </div>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Datos recibidos del webhook de integración
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDebugData} 
          disabled={loading}
        >
          <RefreshCcw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Cargar Datos
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="summary">
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="flex items-center"
            >
              <FileText className="h-3 w-3 mr-1" />
              Facturas sin Pagar
              {unpaidInvoices.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-800 rounded-full px-1.5 py-0.5 text-xs">
                  {unpaidInvoices.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <div className="text-xs text-blue-700 font-medium">Facturas sin pagar</div>
                <div className="text-lg font-bold text-blue-900">{unpaidInvoices.length}</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="invoices">
            <InvoicesTab invoices={unpaidInvoices} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WebhookDebug;
