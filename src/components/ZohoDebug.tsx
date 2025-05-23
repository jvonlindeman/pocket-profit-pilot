
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bug } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';

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
            <TabsList className="grid grid-cols-3 w-[300px]">
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 border border-green-100 rounded">
                    <h3 className="font-medium text-green-800">Income Transactions</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData.payments) 
                        ? `Found ${rawData.payments.length} income transactions` 
                        : 'No income transactions found'}
                    </p>
                    {Array.isArray(rawData.payments) && rawData.payments.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {rawData.payments.slice(0, 3).map((item: any, i: number) => (
                          <li key={i} className="text-green-700">
                            {item.customer_name}: {item.amount}
                          </li>
                        ))}
                        {rawData.payments.length > 3 && (
                          <li className="text-green-600">...and {rawData.payments.length - 3} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded">
                    <h3 className="font-medium text-amber-800">Expense Transactions</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData.expenses) 
                        ? `Found ${rawData.expenses.length} expense transactions` 
                        : 'No expense transactions found'}
                    </p>
                    {Array.isArray(rawData.expenses) && rawData.expenses.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {rawData.expenses.slice(0, 3).map((item: any, i: number) => (
                          <li key={i} className="text-amber-700">
                            {item.vendor_name || 'No vendor'}: {item.total}
                          </li>
                        ))}
                        {rawData.expenses.length > 3 && (
                          <li className="text-amber-600">...and {rawData.expenses.length - 3} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded">
                    <h3 className="font-medium text-blue-800">Collaborator Expenses</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData.colaboradores) 
                        ? `Found ${rawData.colaboradores.length} collaborator expenses` 
                        : 'No collaborator expenses found'}
                    </p>
                    {Array.isArray(rawData.colaboradores) && rawData.colaboradores.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1">
                        {rawData.colaboradores.slice(0, 3).map((item: any, i: number) => (
                          <li key={i} className="text-blue-700">
                            {item.vendor_name || 'No vendor'}: {item.total}
                          </li>
                        ))}
                        {rawData.colaboradores.length > 3 && (
                          <li className="text-blue-600">...and {rawData.colaboradores.length - 3} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded">
                    <h3 className="font-medium text-purple-800">Cached Transactions</h3>
                    <p className="text-sm mt-1">
                      {Array.isArray(rawData.cached_transactions) 
                        ? `Found ${rawData.cached_transactions.length} cached transactions` 
                        : 'No cached transactions found'}
                    </p>
                    {Array.isArray(rawData.cached_transactions) && rawData.cached_transactions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs mb-1 text-purple-700">Breakdown by type:</div>
                        <ul className="text-xs space-y-1">
                          <li className="text-purple-700">
                            Income: {rawData.cached_transactions.filter((tx: any) => tx.type === 'income').length}
                          </li>
                          <li className="text-purple-700">
                            Expense: {rawData.cached_transactions.filter((tx: any) => tx.type === 'expense').length}
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="formatted" className="p-0">
              <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
                <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
                  <p className="text-sm text-blue-800 font-medium">Data Structure Overview</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {Array.isArray(rawData) 
                      ? `Array with ${rawData.length} items. Items with vendor_name are expenses, the array at the end contains income transactions.` 
                      : 'Data is in object format with sections for different transaction types.'}
                  </p>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left border-b">Source</th>
                      <th className="p-2 text-left border-b">Type</th>
                      <th className="p-2 text-left border-b">Count</th>
                      <th className="p-2 text-left border-b">Sample Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.payments && (
                      <tr className="bg-green-50">
                        <td className="p-2 border-b">payments</td>
                        <td className="p-2 border-b">Income</td>
                        <td className="p-2 border-b">{Array.isArray(rawData.payments) ? rawData.payments.length : 0}</td>
                        <td className="p-2 border-b">
                          {Array.isArray(rawData.payments) && rawData.payments.length > 0 ? (
                            <div className="text-xs">
                              <span className="font-medium">{rawData.payments[0].customer_name}</span>: {rawData.payments[0].amount}
                            </div>
                          ) : 'No data'}
                        </td>
                      </tr>
                    )}
                    {rawData.expenses && (
                      <tr className="bg-red-50">
                        <td className="p-2 border-b">expenses</td>
                        <td className="p-2 border-b">Expense</td>
                        <td className="p-2 border-b">{Array.isArray(rawData.expenses) ? rawData.expenses.length : 0}</td>
                        <td className="p-2 border-b">
                          {Array.isArray(rawData.expenses) && rawData.expenses.length > 0 ? (
                            <div className="text-xs">
                              <span className="font-medium">{rawData.expenses[0].vendor_name || 'No vendor'}</span>: {rawData.expenses[0].total}
                            </div>
                          ) : 'No data'}
                        </td>
                      </tr>
                    )}
                    {rawData.colaboradores && (
                      <tr className="bg-blue-50">
                        <td className="p-2 border-b">colaboradores</td>
                        <td className="p-2 border-b">Collaborator</td>
                        <td className="p-2 border-b">{Array.isArray(rawData.colaboradores) ? rawData.colaboradores.length : 0}</td>
                        <td className="p-2 border-b">
                          {Array.isArray(rawData.colaboradores) && rawData.colaboradores.length > 0 ? (
                            <div className="text-xs">
                              <span className="font-medium">{rawData.colaboradores[0].vendor_name || 'No vendor'}</span>: {rawData.colaboradores[0].total}
                            </div>
                          ) : 'No data'}
                        </td>
                      </tr>
                    )}
                    {rawData.cached_transactions && (
                      <tr className="bg-purple-50">
                        <td className="p-2 border-b">cached_transactions</td>
                        <td className="p-2 border-b">Processed</td>
                        <td className="p-2 border-b">{Array.isArray(rawData.cached_transactions) ? rawData.cached_transactions.length : 0}</td>
                        <td className="p-2 border-b">
                          {Array.isArray(rawData.cached_transactions) && rawData.cached_transactions.length > 0 ? (
                            <div className="text-xs">
                              <span className="font-medium">{rawData.cached_transactions[0].type}</span>: {rawData.cached_transactions[0].amount}
                            </div>
                          ) : 'No data'}
                        </td>
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
