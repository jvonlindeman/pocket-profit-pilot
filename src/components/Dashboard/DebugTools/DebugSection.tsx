
import React from 'react';
import { Bug } from 'lucide-react';
import StripeDebug from '@/components/StripeDebug';
import WebhookDebug from '@/components/WebhookDebug';
import WebhookRequestDebug from '@/components/WebhookRequestDebug';
import { DateRange } from 'react-day-picker';
import { toDayPickerDateRange } from '@/utils/dateRangeAdapter';

interface DebugSectionProps {
  dateRange: { startDate: Date; endDate: Date };
  refreshData: (force: boolean) => void;
  rawResponse: any;
}

const DebugSection: React.FC<DebugSectionProps> = ({
  dateRange,
  refreshData,
  rawResponse
}) => {
  // Convert financial date range to day picker date range
  const dayPickerDateRange: DateRange = toDayPickerDateRange(dateRange);
  
  return (
    <div className="mt-8 grid grid-cols-1 gap-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
        <Bug className="h-5 w-5 mr-2 text-amber-500" />
        Herramientas de depuración
      </h2>
      
      {/* Componente de depuración de Webhook Zoho - Passing rawResponse */}
      <WebhookDebug 
        dateRange={dayPickerDateRange}
        refreshDataFunction={refreshData}
        rawResponse={rawResponse}
      />
      
      {/* Nuevo componente de depuración de Stripe */}
      <StripeDebug 
        dateRange={dateRange} 
        refreshDataFunction={refreshData}
      />
      
      {/* Componente de depuración de solicitud al webhook */}
      <WebhookRequestDebug dateRange={dateRange} />
    </div>
  );
};

export default DebugSection;
