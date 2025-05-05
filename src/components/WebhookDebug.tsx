
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bug } from 'lucide-react';
import ZohoService from '@/services/zohoService';

interface WebhookDebugProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export default function WebhookDebug({ dateRange }: WebhookDebugProps) {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener los datos crudos del API
  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener datos de respuesta crudos
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

  // Cargar datos automáticamente al montar el componente o cuando cambie el rango de fechas
  useEffect(() => {
    console.log("WebhookDebug: Loading debug data automatically");
    fetchDebugData();
  }, [dateRange.startDate, dateRange.endDate]);

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
              <><RefreshCw className="h-4 w-4 mr-2" /> Actualizar</>
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && !rawData && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {rawData && (
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
