
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bug } from 'lucide-react';
import ZohoService from '@/services/zohoService';
import WebhookDebugHeader from './WebhookDebug/WebhookDebugHeader';
import WebhookErrorDisplay from './WebhookDebug/WebhookErrorDisplay';

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

  // Cuando cambia rawResponse desde el componente principal, actualizamos nuestro estado local
  useEffect(() => {
    if (rawResponse) {
      setRawData(rawResponse);
      console.log("WebhookDebug: Received rawResponse from parent:", rawResponse);
    }
  }, [rawResponse]);

  // Función para obtener los datos crudos del API
  const fetchDebugData = async () => {
    console.log("WebhookDebug: fetchDebugData called");
    setLoading(true);
    setError(null);
    
    try {
      // First check if there's a global refresh function
      if (refreshDataFunction) {
        console.log("WebhookDebug: Using global refresh function with forceRefresh=true");
        
        try {
          // Always force refresh when button is clicked directly
          await refreshDataFunction(true);
          console.log("WebhookDebug: Global refresh function completed successfully");
          
          // The useEffect above will handle setting rawData from rawResponse
          // Wait a brief moment to ensure the parent component has time to update rawResponse
          await new Promise(resolve => setTimeout(resolve, 250));
          
          // Check if we already have data through rawResponse
          if (rawResponse) {
            console.log("WebhookDebug: Using rawResponse from parent");
            setRawData(rawResponse);
            setLoading(false);
            return;
          }
        } catch (refreshErr: any) {
          console.error("WebhookDebug: Error in global refresh function:", refreshErr);
          // Continue to direct fetch since global refresh failed
          setError(`Error en función de actualización global: ${refreshErr.message || "Error desconocido"}`);
        }
      }
      
      console.log("WebhookDebug: Falling back to direct ZohoService.getRawResponse");
      // Fall back to direct fetch
      try {
        const data = await ZohoService.getRawResponse(dateRange.startDate, dateRange.endDate);
        console.log("WebhookDebug: Direct fetch successful:", data);
        setRawData(data);
      } catch (directErr: any) {
        console.error("WebhookDebug: Error in direct fetch:", directErr);
        throw directErr; // Re-throw to be caught by outer try/catch
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error desconocido al obtener datos";
      console.error("WebhookDebug: Failed to fetch debug data:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper para determinar si un item es un array de ingresos
  const isIncomeArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'customer_name' in item[0] && 
           'amount' in item[0];
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

        {rawData && !loading && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="formatted">Formateado</TabsTrigger>
              <TabsTrigger value="raw">JSON Crudo</TabsTrigger>
            </TabsList>
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-sm text-blue-800 font-medium">Resumen de la Estructura</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {Array.isArray(rawData) 
                      ? `Array con ${rawData.length} elementos. Los elementos con vendor_name son gastos, el array al final contiene ingresos.` 
                      : 'Los datos no están en el formato esperado (array)'}
                  </p>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border-b">Elemento #</th>
                      <th className="p-2 text-left border-b">Tipo</th>
                      <th className="p-2 text-left border-b">Datos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(rawData) ? (
                      rawData.map((item, index) => (
                        <tr key={index} className={isIncomeArray(item) ? "bg-green-50" : ""}>
                          <td className="p-2 border-b">{index + 1}</td>
                          <td className="p-2 border-b font-medium">
                            {isIncomeArray(item) 
                              ? `Array de Ingresos (${Array.isArray(item) ? item.length : 0} elementos)` 
                              : item && typeof item === 'object' && 'vendor_name' in item 
                                ? `Gasto (${item.vendor_name || 'Sin proveedor'})` 
                                : Array.isArray(item) && item.length > 0 && item[0].vendor_name
                                  ? `Array de Facturas (${item.length} elementos)`
                                  : 'Desconocido'}
                          </td>
                          <td className="p-2 border-b">
                            {isIncomeArray(item) ? (
                              <div>
                                <p className="font-medium mb-1">Ejemplos de ingresos:</p>
                                <ul className="list-disc pl-5">
                                  {Array.isArray(item) && item.slice(0, 3).map((income, idx) => (
                                    <li key={idx} className="text-sm">
                                      {income.customer_name}: {income.amount}
                                    </li>
                                  ))}
                                  {Array.isArray(item) && item.length > 3 && (
                                    <li className="text-xs text-gray-500">
                                      ...y {item.length - 3} más
                                    </li>
                                  )}
                                </ul>
                              </div>
                            ) : (
                              <div>
                                {item && typeof item === 'object' ? (
                                  <ul className="list-disc pl-5">
                                    {Object.entries(item).map(([key, value]) => (
                                      <li key={key} className="text-sm">
                                        <span className="font-medium">{key}:</span> {String(value)}
                                      </li>
                                    ))}
                                  </ul>
                                ) : Array.isArray(item) ? (
                                  <div>
                                    <p className="font-medium mb-1">Ejemplos de facturas:</p>
                                    <ul className="list-disc pl-5">
                                      {item.slice(0, 3).map((bill, idx) => (
                                        <li key={idx} className="text-sm">
                                          {bill.vendor_name ? `${bill.vendor_name}: ${bill.total}` : JSON.stringify(bill)}
                                        </li>
                                      ))}
                                      {item.length > 3 && (
                                        <li className="text-xs text-gray-500">
                                          ...y {item.length - 3} más
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                ) : (
                                  String(item)
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : typeof rawData === 'object' ? (
                      <tr>
                        <td colSpan={3} className="p-2 border-b">
                          <ul className="list-disc pl-5">
                            {Object.entries(rawData || {}).map(([key, value]) => (
                              <li key={key} className="text-sm">
                                <span className="font-medium">{key}:</span> {
                                  typeof value === 'object' 
                                    ? JSON.stringify(value) 
                                    : String(value)
                                }
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-2 border-b">{String(rawData)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
      </CardContent>
    </Card>
  );
}
