
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import WebhookErrorDisplay from './WebhookErrorDisplay';
import WebhookConfigAlert from './WebhookConfigAlert';
import WebhookDataTabs from './WebhookDataTabs';
import WebhookTroubleshootingGuide from './WebhookTroubleshootingGuide';
import WebhookDataWarning from './WebhookDataWarning';
import WebhookDebugHeader from './WebhookDebugHeader';
import { useWebhookDebug } from '@/hooks/useWebhookDebug';

interface WebhookDebugProps {
  dateRange: DateRange;
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any;
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  // Use the custom hook for all data fetching and state management
  const {
    loading,
    rawData,
    error,
    configIssue,
    fetchDebugData,
    hasUsableData
  } = useWebhookDebug({
    dateRange,
    refreshDataFunction,
    initialRawResponse: rawResponse
  });

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
        {/* Header with fetch button */}
        <WebhookDebugHeader 
          loading={loading} 
          onFetchData={fetchDebugData}
          configError={configIssue}
        />

        {/* Configuration issue alert */}
        {configIssue && <WebhookConfigAlert />}

        {/* Data quality warning */}
        {rawData && !hasUsableData(rawData) && !configIssue && <WebhookDataWarning />}

        {/* Error display */}
        <WebhookErrorDisplay error={error} />

        {/* Loading state is handled in the WebhookDataTabs component */}
        {rawData && !loading && (
          <WebhookDataTabs rawData={rawData} isLoading={loading} />
        )}

        {/* Troubleshooting guide */}
        <WebhookTroubleshootingGuide />
      </CardContent>
    </Card>
  );
}
