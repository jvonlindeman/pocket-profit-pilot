
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bug, AlertTriangle } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';
import { DateRange } from 'react-day-picker';
import { toFinancialDateRange } from '@/utils/dateRangeAdapter';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WebhookDebugProps {
  dateRange: DateRange;
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any;
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(rawResponse || null);
  const [error, setError] = useState<string | null>(null);

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
      }
      
      // Convert from DayPicker format to our Financial format
      const financialDateRange = toFinancialDateRange(dateRange);
      
      // Get raw data to show in the debug UI
      const data = await ZohoService.getRawResponse(
        financialDateRange.startDate, 
        financialDateRange.endDate
      );
      setRawData(data);
      console.log("Debug data received:", data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      console.error("Failed to fetch debug data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if webhook has usable data
  const hasUsableData = (data: any): boolean => {
    if (!data) return false;
    
    // Check for common webhook data structures
    const hasPayments = Array.isArray(data.payments) && data.payments.length > 0;
    const hasExpenses = Array.isArray(data.expenses) && data.expenses.length > 0;
    const hasCollaborators = Array.isArray(data.colaboradores) && data.colaboradores.length > 0;
    const hasCachedTransactions = Array.isArray(data.cached_transactions) && data.cached_transactions.length > 0;
    
    return hasPayments || hasExpenses || hasCollaborators || hasCachedTransactions;
  };

  // Detect webhook configuration issue
  const hasConfigIssue = rawData && rawData.error && (
    rawData.error.includes("webhook URL") || 
    rawData.error.includes("Make webhook URL is not configured")
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-amber-500" />
          Depuración de Webhook
        </CardTitle>
        <CardDescription>
          Ver la respuesta del webhook de Zoho Books para detectar problemas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Esta herramienta te permite verificar la conexión y datos del webhook
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

        {hasConfigIssue && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de configuración del webhook</AlertTitle>
            <AlertDescription>
              La URL del webhook de Make.com no está configurada. 
              Por favor configura la variable de entorno <code>MAKE_WEBHOOK_URL</code> en 
              las funciones Edge de Supabase.
            </AlertDescription>
          </Alert>
        )}

        {rawData && !hasUsableData(rawData) && !hasConfigIssue && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Datos incompletos o vacíos</AlertTitle>
            <AlertDescription>
              El webhook está conectado pero devuelve datos incompletos o vacíos. 
              Posibles causas:
              <ul className="list-disc pl-5 mt-2">
                <li>No hay transacciones en el período seleccionado</li>
                <li>El webhook de Make.com está mal configurado</li>
                <li>Los datos están siendo filtrados por la configuración de exclusiones</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <WebhookErrorDisplay error={error} />

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {rawData && !loading && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-3 w-[300px]">
              <TabsTrigger value="formatted">Formateado</TabsTrigger>
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-sm text-blue-800 font-medium">Resumen de la Estructura</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {Array.isArray(rawData) 
                      ? `Array con ${rawData.length} elementos` 
                      : 'Objecto con estructura de datos de webhook'}
                  </p>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border-b">Clave</th>
                      <th className="p-2 text-left border-b">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeof rawData === 'object' && rawData !== null ? (
                      Object.entries(rawData).map(([key, value]) => (
                        <tr key={key}>
                          <td className="p-2 border-b font-medium">{key}</td>
                          <td className="p-2 border-b">
                            {typeof value === 'object' 
                              ? `${Array.isArray(value) ? 'Array' : 'Object'} con ${Array.isArray(value) ? value.length : Object.keys(value).length} elementos`
                              : String(value)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="p-2 border-b">
                          {String(rawData)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="summary" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 border border-green-100 rounded">
                    <h3 className="font-medium text-green-800">Transacciones de Ingreso</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData?.payments) 
                        ? `Encontradas ${rawData.payments.length} transacciones de ingreso` 
                        : 'No se encontraron transacciones de ingreso'}
                    </p>
                    {Array.isArray(rawData?.payments) && rawData.payments.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {rawData.payments.slice(0, 3).map((item: any, i: number) => (
                          <li key={i} className="text-green-700">
                            {item.customer_name || 'Cliente'}: {item.amount || 0}
                          </li>
                        ))}
                        {rawData.payments.length > 3 && (
                          <li className="text-green-600">...y {rawData.payments.length - 3} más</li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded">
                    <h3 className="font-medium text-amber-800">Transacciones de Gasto</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData?.expenses) 
                        ? `Encontradas ${rawData.expenses.length} transacciones de gasto` 
                        : 'No se encontraron transacciones de gasto'}
                    </p>
                    {Array.isArray(rawData?.expenses) && rawData.expenses.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {rawData.expenses.slice(0, 3).map((item: any, i: number) => (
                          <li key={i} className="text-amber-700">
                            {item.vendor_name || 'Sin proveedor'}: {item.total || 0}
                          </li>
                        ))}
                        {rawData.expenses.length > 3 && (
                          <li className="text-amber-600">...y {rawData.expenses.length - 3} más</li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded">
                    <h3 className="font-medium text-blue-800">Gastos de Colaboradores</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData?.colaboradores) 
                        ? `Encontrados ${rawData.colaboradores.length} gastos de colaboradores` 
                        : 'No se encontraron gastos de colaboradores'}
                    </p>
                    {Array.isArray(rawData?.colaboradores) && rawData.colaboradores.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {rawData.colaboradores.slice(0, 3).map((item: any, i: number) => (
                          <li key={i} className="text-blue-700">
                            {item.vendor_name || 'Sin nombre'}: {item.total || 0}
                          </li>
                        ))}
                        {rawData.colaboradores.length > 3 && (
                          <li className="text-blue-600">...y {rawData.colaboradores.length - 3} más</li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded">
                    <h3 className="font-medium text-purple-800">Transacciones Procesadas</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData?.cached_transactions) 
                        ? `Encontradas ${rawData.cached_transactions.length} transacciones procesadas` 
                        : 'No se encontraron transacciones procesadas'}
                    </p>
                    {Array.isArray(rawData?.cached_transactions) && rawData.cached_transactions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs mb-1 text-purple-700">Desglose por tipo:</div>
                        <ul className="text-xs space-y-1">
                          <li className="text-purple-700">
                            Ingresos: {rawData.cached_transactions.filter((tx: any) => tx.type === 'income').length}
                          </li>
                          <li className="text-purple-700">
                            Gastos: {rawData.cached_transactions.filter((tx: any) => tx.type === 'expense').length}
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="raw" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded text-sm text-gray-600">
          <h3 className="font-medium text-gray-700">Solucionar problemas de webhook</h3>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Verifica que la variable de entorno <code>MAKE_WEBHOOK_URL</code> esté configurada en la función Edge</li>
            <li>Confirma que el webhook de Make.com esté funcionando correctamente</li>
            <li>Comprueba que hay datos en Zoho Books para el período seleccionado</li>
            <li>Revisa la lista de exclusiones en el procesador de Zoho</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
