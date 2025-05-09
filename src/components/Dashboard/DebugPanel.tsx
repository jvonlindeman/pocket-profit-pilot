
import React from 'react';
import { Bug } from 'lucide-react';
import WebhookDebug from '@/components/WebhookDebug';
import WebhookRequestDebug from '@/components/WebhookRequestDebug';
import { DateRange } from '@/types/financial';

interface DebugPanelProps {
  debugMode: boolean;
  dateRange: DateRange;
  refreshData: (force: boolean) => void;
  rawResponse: any;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  debugMode,
  dateRange,
  refreshData,
  rawResponse
}) => {
  if (!debugMode) return null;
  
  return (
    <>
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bug className="h-5 w-5 mr-2 text-amber-500" />
          Depuración del Webhook
        </h2>
        <div className="mt-2">
          <WebhookDebug 
            dateRange={dateRange} 
            refreshDataFunction={refreshData}
            rawResponse={rawResponse}
          />
        </div>
        
        {/* Componente de depuración de solicitud al webhook */}
        <div className="mt-6">
          <WebhookRequestDebug dateRange={dateRange} />
        </div>
      </div>
    </>
  );
};

export default DebugPanel;
