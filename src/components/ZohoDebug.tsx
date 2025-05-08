
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bug, AlertCircle, Database } from 'lucide-react';
import ZohoService from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ZohoDebug() {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to fetch raw data from the API
  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create date range for current month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Get raw response data
      const data = await ZohoService.getRawResponse(startDate, endDate);
      setRawData(data);
      console.log("Debug data received:", data);

      // Process the raw response into a more readable format
      processRawData(data);
      
      toast({
        variant: "default",
        title: "Datos de depuración obtenidos",
        description: "Se han cargado los datos brutos para depuración.",
      });
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido";
      setError(errorMessage);
      console.error("Failed to fetch debug data:", err);
      
      toast({
        variant: "destructive",
        title: "Error al obtener datos de depuración",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Process the raw data into a more structured format
  const processRawData = (data: any) => {
    if (!data) return;
    
    try {
      // Extract financial data
      const financialData = {
        income: 0,
        expense: 0,
        stripe: 0,
        collaborators: []
      };
      
      // Check if it's an array
      if (Array.isArray(data)) {
        // Process each item
        data.forEach((item, index) => {
          if (Array.isArray(item) && item.length > 0 && item[0]?.customer_name) {
            // This is likely the income array
            financialData.income = item.reduce((sum, transaction) => sum + (parseFloat(transaction.amount.toString()) || 0), 0);
          } else if (item && item.vendor_name) {
            // This is likely an expense
            const amount = parseFloat(item.amount?.toString() || '0');
            financialData.expense += amount;
            
            // Check if it's a collaborator expense
            if (item.category === 'Pagos a colaboradores') {
              financialData.collaborators.push({
                name: item.vendor_name,
                amount: amount
              });
            }
          }
        });
      }
      
      // Check if there's a 'stripe' field in the data
      if (data.stripe) {
        // Handle different formats (4.284,51 or 4284.51)
        const stripeValue = String(data.stripe).replace('.', '').replace(',', '.');
        financialData.stripe = parseFloat(stripeValue);
      }
      
      // Check for collaboradores array
      if (data.colaboradores && Array.isArray(data.colaboradores)) {
        financialData.collaborators = data.colaboradores.map((c: any) => ({
          name: c.vendor_name,
          amount: parseFloat(c.total?.toString() || '0')
        }));
      }
      
      setProcessedData(financialData);
      console.log("Processed financial data:", financialData);
    } catch (err) {
      console.error("Error processing raw data:", err);
      setError("Error al procesar los datos brutos");
    }
  };

  // Helper to determine if an item is an income array
  const isIncomeArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'customer_name' in item[0] && 
           'amount' in item[0];
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-amber-500" />
          Zoho Webhook Debug
        </CardTitle>
        <CardDescription>
          Vista detallada de datos para depuración
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Esta herramienta permite ver los datos brutos de la respuesta del webhook de make.com
          </p>
          <Button 
            onClick={fetchDebugData} 
            variant="outline" 
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Cargar datos brutos</>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {processedData && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
            <Database className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-700">Datos procesados</AlertTitle>
            <AlertDescription className="text-blue-700">
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="font-semibold">Ingresos Zoho:</span> ${processedData.income.toFixed(2)}
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="font-semibold">Ingresos Stripe:</span> ${processedData.stripe.toFixed(2)}
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="font-semibold">Gastos totales:</span> ${processedData.expense.toFixed(2)}
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <span className="font-semibold">Total ingresos:</span> ${(processedData.income + processedData.stripe).toFixed(2)}
                </div>
              </div>
              {processedData.collaborators && processedData.collaborators.length > 0 && (
                <div className="mt-2 bg-white p-2 rounded border border-blue-100">
                  <span className="font-semibold">Colaboradores ({processedData.collaborators.length}):</span>
                  <ul className="mt-1 text-sm">
                    {processedData.collaborators.slice(0, 5).map((c: any, idx: number) => (
                      <li key={idx}>{c.name}: ${c.amount.toFixed(2)}</li>
                    ))}
                    {processedData.collaborators.length > 5 && (
                      <li>...y {processedData.collaborators.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {rawData && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="formatted">Formateado</TabsTrigger>
              <TabsTrigger value="raw">JSON Bruto</TabsTrigger>
            </TabsList>
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-sm text-blue-800 font-medium">Estructura de los Datos</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {Array.isArray(rawData) 
                      ? `Array con ${rawData.length} elementos. Los elementos con vendor_name son gastos, el array al final contiene transacciones de ingresos.` 
                      : typeof rawData === 'object' 
                        ? 'Objeto con múltiples propiedades, incluyendo posibles arrays de transacciones.'
                        : 'Los datos no están en el formato esperado'}
                  </p>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border-b">Elemento</th>
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
                                ) : (
                                  String(item)
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : typeof rawData === 'object' ? (
                      Object.entries(rawData || {}).map(([key, value], idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-b">{key}</td>
                          <td className="p-2 border-b font-medium">
                            {Array.isArray(value) 
                              ? `Array (${value.length} elementos)`
                              : typeof value === 'object' && value !== null
                                ? 'Objeto'
                                : typeof value}
                          </td>
                          <td className="p-2 border-b">
                            {Array.isArray(value) ? (
                              <div>
                                <p className="font-medium mb-1">Ejemplos:</p>
                                <ul className="list-disc pl-5">
                                  {value.slice(0, 3).map((item, i) => (
                                    <li key={i} className="text-sm">
                                      {typeof item === 'object' && item !== null
                                        ? JSON.stringify(item).substring(0, 100) + (JSON.stringify(item).length > 100 ? '...' : '')
                                        : String(item)}
                                    </li>
                                  ))}
                                  {value.length > 3 && (
                                    <li className="text-xs text-gray-500">
                                      ...y {value.length - 3} más
                                    </li>
                                  )}
                                </ul>
                              </div>
                            ) : typeof value === 'object' && value !== null ? (
                              <pre className="text-xs whitespace-pre-wrap break-words">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              String(value)
                            )}
                          </td>
                        </tr>
                      ))
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
