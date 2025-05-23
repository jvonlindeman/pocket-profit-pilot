
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Webhook, RefreshCcw, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { zohoRepository } from '@/repositories/zohoRepository';
import InvoicesTab from './InvoicesTab';
import { UnpaidInvoice } from '@/services/zoho/api/types';

interface WebhookDebugProps {
  dateRange: { startDate: Date; endDate: Date };
  refreshDataFunction?: (force: boolean) => void;
  rawResponse?: any;
}

const WebhookDebug: React.FC<WebhookDebugProps> = ({ 
  dateRange, 
  refreshDataFunction = () => {},
  rawResponse = null
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [dataFetched, setDataFetched] = useState(false);
  
  // Use rawResponse if provided, but don't auto-fetch
  useEffect(() => {
    if (rawResponse) {
      console.log("WebhookDebug: received rawResponse:", {
        hasUnpaidInvoices: !!rawResponse.facturas_sin_pagar,
        unpaidInvoicesCount: rawResponse.facturas_sin_pagar?.length || 0,
      });
      
      if (rawResponse.facturas_sin_pagar && Array.isArray(rawResponse.facturas_sin_pagar)) {
        setUnpaidInvoices(rawResponse.facturas_sin_pagar);
        setDataFetched(true);
      }
    }
  }, [rawResponse]);

  // Fetch debug data from Zoho, with explicit user action only
  const fetchDebugData = async () => {
    setLoading(true);
    try {
      // Check if we should use the global refresh function first
      if (refreshDataFunction) {
        console.log("WebhookDebug: Using global refresh function");
        refreshDataFunction(true); // force refresh
        
        // Wait a bit for the refresh to complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get the data from the repository
        const cachedData = zohoRepository.getLastRawResponse();
        
        if (cachedData?.facturas_sin_pagar && Array.isArray(cachedData.facturas_sin_pagar)) {
          console.log("WebhookDebug: Using data from repository after refresh");
          setUnpaidInvoices(cachedData.facturas_sin_pagar);
          setDataFetched(true);
          toast({
            title: "Datos cargados",
            description: `Se encontraron ${cachedData.facturas_sin_pagar.length} facturas sin pagar`,
          });
          setLoading(false);
          return;
        }
      }
      
      // If not using the global refresh function or if it didn't provide data,
      // get data from the repository directly without an API call if possible
      try {
        console.log("WebhookDebug: Fetching unpaid invoices from repository");
        const invoices = await zohoRepository.getUnpaidInvoices(dateRange.startDate, dateRange.endDate);
        
        if (invoices && invoices.length > 0) {
          console.log("WebhookDebug: Got unpaid invoices from repository:", invoices.length);
          setUnpaidInvoices(invoices);
          setDataFetched(true);
          toast({
            title: "Datos cargados",
            description: `Se encontraron ${invoices.length} facturas sin pagar`,
          });
        } else {
          console.log("WebhookDebug: No unpaid invoices found in repository, need to fetch from API");
          // Only make a direct API call if absolutely necessary
          const data = await zohoRepository.getRawResponse(dateRange.startDate, dateRange.endDate, true);
          
          if (data?.facturas_sin_pagar && Array.isArray(data.facturas_sin_pagar)) {
            console.log("WebhookDebug: Fetched unpaid invoices from API:", data.facturas_sin_pagar.length);
            setUnpaidInvoices(data.facturas_sin_pagar);
            setDataFetched(true);
            toast({
              title: "Datos cargados",
              description: `Se encontraron ${data.facturas_sin_pagar.length} facturas sin pagar`,
            });
          } else {
            console.warn("WebhookDebug: No unpaid invoices found after API fetch");
            setUnpaidInvoices([]);
            toast({
              title: "Información",
              description: "No se encontraron facturas sin pagar",
              variant: "default"
            });
          }
        }
      } catch (error) {
        console.error("Error fetching unpaid invoices:", error);
        toast({
          title: "Error",
          description: "Error al cargar las facturas sin pagar",
          variant: "destructive"
        });
        setUnpaidInvoices([]);
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
            {!dataFetched && !loading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Haga clic en "Cargar Datos" para obtener información del webhook.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <div className="text-xs text-blue-700 font-medium">Facturas sin pagar</div>
                  <div className="text-lg font-bold text-blue-900">{unpaidInvoices.length}</div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invoices">
            {!dataFetched && !loading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Haga clic en "Cargar Datos" para ver las facturas sin pagar.
              </div>
            ) : (
              <InvoicesTab invoices={unpaidInvoices} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WebhookDebug;
