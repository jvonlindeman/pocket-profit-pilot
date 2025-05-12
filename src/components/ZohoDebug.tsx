
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bug } from 'lucide-react';
import ZohoService from '@/services/zohoService';

export default function ZohoDebug() {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      console.error("Failed to fetch debug data:", err);
    } finally {
      setLoading(false);
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
          View raw webhook response data for debugging purposes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            This tool lets you view the raw make.com webhook response data
          </p>
          <Button 
            onClick={fetchDebugData} 
            variant="outline" 
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Fetch Raw Data</>
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {rawData && (
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-sm text-blue-800 font-medium">Data Structure Overview</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {Array.isArray(rawData) 
                      ? `Array with ${rawData.length} items. Items with vendor_name are expenses, the array at the end contains income transactions.` 
                      : 'Data is not in expected array format'}
                  </p>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border-b">Item #</th>
                      <th className="p-2 text-left border-b">Type</th>
                      <th className="p-2 text-left border-b">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(rawData) ? (
                      rawData.map((item, index) => (
                        <tr key={index} className={isIncomeArray(item) ? "bg-green-50" : ""}>
                          <td className="p-2 border-b">{index + 1}</td>
                          <td className="p-2 border-b font-medium">
                            {isIncomeArray(item) 
                              ? `Income Array (${Array.isArray(item) ? item.length : 0} items)` 
                              : item && typeof item === 'object' && 'vendor_name' in item 
                                ? `Expense (${item.vendor_name || 'No vendor'})` 
                                : 'Unknown'}
                          </td>
                          <td className="p-2 border-b">
                            {isIncomeArray(item) ? (
                              <div>
                                <p className="font-medium mb-1">Sample income items:</p>
                                <ul className="list-disc pl-5">
                                  {Array.isArray(item) && item.slice(0, 3).map((income, idx) => (
                                    <li key={idx} className="text-sm">
                                      {income.customer_name}: {income.amount}
                                    </li>
                                  ))}
                                  {Array.isArray(item) && item.length > 3 && (
                                    <li className="text-xs text-gray-500">
                                      ...and {item.length - 3} more
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
