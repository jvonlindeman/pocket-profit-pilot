
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border-b">Field</th>
                      <th className="p-2 text-left border-b">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(rawData) ? (
                      <>
                        <tr>
                          <td className="p-2 border-b font-medium" colSpan={2}>
                            Array with {rawData.length} items:
                          </td>
                        </tr>
                        {rawData.slice(0, 5).map((item: any, index: number) => (
                          <React.Fragment key={index}>
                            <tr className="bg-gray-100">
                              <td className="p-2 border-b font-medium" colSpan={2}>
                                Item {index + 1}:
                              </td>
                            </tr>
                            {Object.entries(item).map(([key, value]) => (
                              <tr key={`${index}-${key}`}>
                                <td className="p-2 border-b font-medium">{key}</td>
                                <td className="p-2 border-b">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value)
                                    : String(value)
                                  }
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                        {rawData.length > 5 && (
                          <tr>
                            <td className="p-2 border-b text-center text-gray-500" colSpan={2}>
                              ... and {rawData.length - 5} more items
                            </td>
                          </tr>
                        )}
                      </>
                    ) : typeof rawData === 'object' ? (
                      Object.entries(rawData || {}).map(([key, value]) => (
                        <tr key={key}>
                          <td className="p-2 border-b font-medium">{key}</td>
                          <td className="p-2 border-b">
                            {typeof value === 'object' 
                              ? JSON.stringify(value)
                              : String(value)
                            }
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 border-b font-medium">Value</td>
                        <td className="p-2 border-b">{String(rawData)}</td>
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
