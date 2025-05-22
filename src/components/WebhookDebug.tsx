import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bug, Calendar, FileText } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';
import { formatDateYYYYMMDD } from '@/utils/dateUtils';

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

  // Helper to determine if an item is an array of income
  const isIncomeArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'customer_name' in item[0] && 
           'amount' in item[0];
  };
  
  // Helper to check for collaborator data
  const isCollaboratorArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'vendor_name' in item[0] && 
           'total' in item[0];
  };

  // Helper to check for unpaid invoices data
  const isUnpaidInvoicesArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'balance' in item[0] && 
           'customer_name' in item[0];
  };
  
  // Helper to format a date for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      // Use the safer date parsing method
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('es-ES').format(date);
      } 
      return dateString; // Return original if parsing fails
    } catch (error) {
      return dateString;
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
                              : isUnpaidInvoicesArray(item)
                                ? `Facturas sin pagar (${Array.isArray(item) ? item.length : 0} elementos)`
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
                            ) : isUnpaidInvoicesArray(item) ? (
                              <div>
                                <p className="font-medium mb-1">Ejemplos de facturas sin pagar:</p>
                                <ul className="list-disc pl-5">
                                  {Array.isArray(item) && item.slice(0, 3).map((invoice, idx) => (
                                    <li key={idx} className="text-sm">
                                      {invoice.customer_name}: ${invoice.balance}
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
            
            <TabsContent value="collaborators" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-sm text-blue-800 font-medium">Datos de Colaboradores</p>
                  <p className="text-xs text-blue-700 mt-1 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Analizando fechas y datos de colaboradores
                  </p>
                </div>

                {rawData && rawData.colaboradores && Array.isArray(rawData.colaboradores) ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left border-b">Colaborador</th>
                        <th className="p-2 text-left border-b">Fecha (Raw)</th>
                        <th className="p-2 text-left border-b">Fecha (Formateada)</th>
                        <th className="p-2 text-right border-b">Importe</th>
                        <th className="p-2 text-center border-b">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.colaboradores.map((collab: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-2 border-b font-medium">{collab.vendor_name || 'Sin nombre'}</td>
                          <td className="p-2 border-b text-gray-600">
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                              {collab.date || 'Sin fecha'}
                            </code>
                          </td>
                          <td className="p-2 border-b">
                            {collab.date ? formatDateForDisplay(collab.date) : 'Sin fecha'}
                          </td>
                          <td className="p-2 border-b text-right">${collab.total?.toLocaleString() || '0'}</td>
                          <td className="p-2 border-b text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              collab.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {collab.status || 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de colaboradores disponibles
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* New tab for unpaid invoices */}
            <TabsContent value="invoices" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-sm text-blue-800 font-medium">Facturas Sin Pagar</p>
                  <p className="text-xs text-blue-700 mt-1 flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    Facturas pendientes de cobro
                  </p>
                </div>

                {rawData && rawData.facturas_sin_pagar && Array.isArray(rawData.facturas_sin_pagar) ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left border-b">Cliente</th>
                        <th className="p-2 text-left border-b">Empresa</th>
                        <th className="p-2 text-right border-b">Balance Pendiente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.facturas_sin_pagar.map((invoice: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-2 border-b font-medium">{invoice.customer_name || 'Sin nombre'}</td>
                          <td className="p-2 border-b">{invoice.company_name || '-'}</td>
                          <td className="p-2 border-b text-right font-medium text-amber-700">
                            ${invoice.balance?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-50">
                      <tr>
                        <td colSpan={2} className="p-2 border-t font-medium">Total Facturas Pendientes</td>
                        <td className="p-2 border-t text-right font-medium text-amber-800">
                          ${rawData.facturas_sin_pagar
                            .reduce((sum: number, inv: any) => sum + (parseFloat(inv.balance) || 0), 0)
                            .toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de facturas sin pagar disponibles
                  </div>
                )}
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
