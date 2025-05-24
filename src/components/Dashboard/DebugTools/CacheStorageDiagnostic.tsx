
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export default function CacheStorageDiagnostic() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostic = async () => {
    setRunning(true);
    setResults([]);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Step 1: Check Stripe data in May 2025
      diagnosticResults.push({
        step: 'Checking Stripe data for May 2025',
        status: 'success',
        message: 'Starting diagnostic...'
      });

      const { data: stripeTransactions, error: stripeError } = await supabase
        .from('cached_transactions')
        .select('*')
        .eq('source', 'Stripe')
        .eq('year', 2025)
        .eq('month', 5);

      if (stripeError) {
        diagnosticResults.push({
          step: 'Stripe data check',
          status: 'error',
          message: `Error querying Stripe data: ${stripeError.message}`
        });
      } else {
        diagnosticResults.push({
          step: 'Stripe data check',
          status: stripeTransactions?.length > 0 ? 'success' : 'warning',
          message: `Found ${stripeTransactions?.length || 0} Stripe transactions for May 2025`,
          data: { count: stripeTransactions?.length || 0 }
        });
      }

      // Step 2: Check monthly cache record
      const { data: monthlyCache, error: cacheError } = await supabase
        .from('monthly_cache')
        .select('*')
        .eq('source', 'Stripe')
        .eq('year', 2025)
        .eq('month', 5);

      if (cacheError) {
        diagnosticResults.push({
          step: 'Monthly cache check',
          status: 'error',
          message: `Error querying monthly cache: ${cacheError.message}`
        });
      } else {
        diagnosticResults.push({
          step: 'Monthly cache check',
          status: monthlyCache?.length > 0 ? 'success' : 'warning',
          message: `Monthly cache record exists: ${monthlyCache?.length > 0 ? 'Yes' : 'No'}`,
          data: monthlyCache?.[0]
        });
      }

      // Step 3: Check cache segments
      const { data: segments, error: segmentError } = await supabase
        .from('cache_segments')
        .select('*')
        .eq('source', 'Stripe')
        .gte('start_date', '2025-05-01')
        .lte('end_date', '2025-05-31');

      if (segmentError) {
        diagnosticResults.push({
          step: 'Cache segments check',
          status: 'error',
          message: `Error querying cache segments: ${segmentError.message}`
        });
      } else {
        diagnosticResults.push({
          step: 'Cache segments check',
          status: segments?.length > 0 ? 'success' : 'warning',
          message: `Found ${segments?.length || 0} cache segments for May 2025`,
          data: segments
        });
      }

      // Step 4: Test Stripe API connectivity
      try {
        const { data: apiTest, error: apiError } = await supabase.functions.invoke('stripe-balance', {
          body: {
            startDate: '2025-05-01',
            endDate: '2025-05-31'
          }
        });

        if (apiError) {
          diagnosticResults.push({
            step: 'Stripe API test',
            status: 'error',
            message: `Stripe API error: ${apiError.message}`
          });
        } else {
          diagnosticResults.push({
            step: 'Stripe API test',
            status: 'success',
            message: `Stripe API working - returned ${apiTest?.transactions?.length || 0} transactions`,
            data: { 
              transactionCount: apiTest?.transactions?.length || 0,
              summary: apiTest?.summary 
            }
          });
        }
      } catch (apiErr) {
        diagnosticResults.push({
          step: 'Stripe API test',
          status: 'error',
          message: `Stripe API exception: ${apiErr instanceof Error ? apiErr.message : 'Unknown error'}`
        });
      }

    } catch (err) {
      diagnosticResults.push({
        step: 'General diagnostic',
        status: 'error',
        message: `Diagnostic failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }

    setResults(diagnosticResults);
    setRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Diagnóstico de Almacenamiento de Cache
        </CardTitle>
        <CardDescription>
          Diagnostica problemas de almacenamiento de datos de Stripe en la base de datos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button 
            onClick={runDiagnostic} 
            disabled={running}
            className="flex items-center gap-2"
          >
            {running ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {running ? 'Ejecutando Diagnóstico...' : 'Ejecutar Diagnóstico'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Resultados del Diagnóstico:</h3>
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-50 border-green-200' :
                  result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.step}</div>
                    <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Ver datos</summary>
                        <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
