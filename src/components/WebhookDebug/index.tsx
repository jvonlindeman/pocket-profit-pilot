
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Bug } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';
import { DateRange } from 'react-day-picker';
import { toFinancialDateRange } from '@/utils/dateRangeAdapter';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import WebhookConfigAlert from './WebhookConfigAlert';
import WebhookDataTabs from './WebhookDataTabs';
import WebhookTroubleshootingGuide from './WebhookTroubleshootingGuide';
import WebhookDataWarning from './WebhookDataWarning';

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

        {hasConfigIssue && <WebhookConfigAlert />}

        {rawData && !hasUsableData(rawData) && !hasConfigIssue && <WebhookDataWarning />}

        <WebhookErrorDisplay error={error} />

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {rawData && !loading && (
          <WebhookDataTabs rawData={rawData} />
        )}

        <WebhookTroubleshootingGuide />
      </CardContent>
    </Card>
  );
}
