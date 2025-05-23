
import React from 'react';
import { Bug } from 'lucide-react';
import StripeDebug from '@/components/StripeDebug';
import WebhookDebug from '@/components/WebhookDebug';
import WebhookRequestDebug from '@/components/WebhookRequestDebug';

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
  // Convert from Financial date range to DayPicker format for WebhookDebug
  const dayPickerDateRange = {
    from: dateRange.startDate,
    to: dateRange.endDate
  };
  
  return (
    <div className="mt-8 grid grid-cols-1 gap-6">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
        <Bug className="h-5 w-5 mr-2 text-amber-500" />
        Herramientas de depuración
      </h2>
      
      {/* Nuevo componente de depuración de Stripe */}
      <StripeDebug 
        dateRange={dateRange} 
        refreshDataFunction={refreshData}
      />
      
      {/* Componente de depuración de Webhook Zoho */}
      <WebhookDebug 
        dateRange={dayPickerDateRange}
        refreshDataFunction={refreshData}
        rawResponse={rawResponse}
      />
      
      {/* Componente de depuración de solicitud al webhook */}
      <WebhookRequestDebug dateRange={dateRange} />
    </div>
  );
};

export default DebugSection;
