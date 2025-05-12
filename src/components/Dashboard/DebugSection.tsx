
import React from 'react';
import { Bug } from 'lucide-react';
import WebhookDebug from '@/components/WebhookDebug';
import WebhookRequestDebug from '@/components/WebhookRequestDebug';
import { DateRange } from '@/types/financial';

interface DebugSectionProps {
  dateRange: DateRange;
  refreshDataFunction: (force?: boolean) => void;
  rawResponse: any;
}

const DebugSection: React.FC<DebugSectionProps> = ({ 
  dateRange, 
  refreshDataFunction, 
  rawResponse 
}) => {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
        <Bug className="h-5 w-5 mr-2 text-amber-500" />
        Depuración del Webhook
      </h2>
      <div className="mt-2">
        <WebhookDebug 
          dateRange={dateRange} 
          refreshDataFunction={refreshDataFunction}
          rawResponse={rawResponse}
        />
      </div>
      
      <div className="mt-6">
        <WebhookRequestDebug dateRange={dateRange} />
      </div>
    </div>
  );
};

export default DebugSection;
