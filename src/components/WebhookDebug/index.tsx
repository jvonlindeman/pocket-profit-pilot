
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bug } from 'lucide-react';
import * as ZohoService from '@/services/zohoService';
import { DateRange } from 'react-day-picker';
import { toFinancialDateRange } from '@/utils/dateRangeAdapter';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import WebhookConfigAlert from './WebhookConfigAlert';
import WebhookDataTabs from './WebhookDataTabs';
import WebhookTroubleshootingGuide from './WebhookTroubleshootingGuide';
import WebhookDataWarning from './WebhookDataWarning';
import WebhookDebugHeader from './WebhookDebugHeader';

interface WebhookDebugProps {
  dateRange: DateRange;
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any;
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(rawResponse || null);
  const [error, setError] = useState<string | null>(null);
  const [configIssue, setConfigIssue] = useState(false);

  // Detect if there's a raw response from the parent on mount or prop change
  useEffect(() => {
    if (rawResponse) {
      setRawData(rawResponse);
      // Check for webhook config issues
      detectConfigurationIssues(rawResponse);
      console.log("WebhookDebug: Received rawResponse from parent:", rawResponse);
    }
  }, [rawResponse]);

  // Function to detect webhook configuration issues in the response
  const detectConfigurationIssues = (data: any) => {
    if (!data) return false;
    
    // Clear previous config issue status
    let hasConfigIssue = false;
    
    // Check for common webhook configuration issues in the response
    if (data.error && typeof data.error === 'string') {
      const errorLower = data.error.toLowerCase();
      hasConfigIssue = 
        errorLower.includes('webhook url is not configured') || 
        errorLower.includes('make webhook url') ||
        errorLower.includes('environment variable is not set');
    }
    
    // Check if webhook_url_configured flag is explicitly false
    if (data.webhook_url_configured === false) {
      hasConfigIssue = true;
    }
    
    // Update state with the detected issue
    setConfigIssue(hasConfigIssue);
    return hasConfigIssue;
  };

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
      detectConfigurationIssues(data);
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
  const hasConfigIssue = configIssue || (
    rawData && rawData.error && (
      rawData.error.includes("webhook URL") || 
      rawData.error.includes("Make webhook URL is not configured")
    )
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
        <WebhookDebugHeader 
          loading={loading} 
          onFetchData={fetchDebugData}
          configError={hasConfigIssue}
        />

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
