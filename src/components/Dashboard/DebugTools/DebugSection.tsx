
import React, { useState, useEffect } from 'react';
import { Bug } from 'lucide-react';
import StripeDebug from '@/components/Dashboard/DebugTools/StripeDebug';
import WebhookDebug from '@/components/Dashboard/DebugTools/WebhookDebug';
import WebhookRequestDebug from '@/components/WebhookRequestDebug';
import { stripeRepository } from '@/repositories/stripeRepository';
import { dataFetcherService } from '@/services/dataFetcherService';

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
  const [stripeRawData, setStripeRawData] = useState<any>(null);
  
  // Update Stripe raw data whenever raw response changes
  useEffect(() => {
    // Try to get data from the service first (preferred)
    let stripeData = dataFetcherService.getLastRawResponse();
    
    // Fall back to the repository if not available from the service
    if (!stripeData) {
      stripeData = stripeRepository.getLastRawResponse();
    }
    
    if (stripeData) {
      setStripeRawData(stripeData);
    }
  }, [rawResponse]);
  
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
      
      {/* Stripe debug component with improved props */}
      <StripeDebug 
        dateRange={dateRange} 
        refreshDataFunction={refreshData}
        stripeRawData={stripeRawData}
      />
      
      {/* Webhook debug component with centralized raw response */}
      <WebhookDebug 
        dateRange={dayPickerDateRange}
        refreshDataFunction={refreshData}
        rawResponse={rawResponse}
      />
      
      {/* Webhook request debug component */}
      <WebhookRequestDebug dateRange={dateRange} />
    </div>
  );
};

export default DebugSection;
