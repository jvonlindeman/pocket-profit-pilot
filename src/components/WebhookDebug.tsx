
import React from 'react';
import WebhookDebug from './WebhookDebug/index'; // Import the refactored component
import { DateRange } from 'react-day-picker';
import { toDayPickerDateRange } from '@/utils/dateRangeAdapter';

interface WebhookDebugLegacyProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  } | DateRange;
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any;
}

// Legacy wrapper to maintain backward compatibility
export default function WebhookDebugLegacy({ 
  dateRange, 
  refreshDataFunction,
  rawResponse 
}: WebhookDebugLegacyProps) {
  // Check if dateRange is already in DayPicker format
  if ('from' in dateRange && 'to' in dateRange) {
    return (
      <WebhookDebug 
        dateRange={dateRange as DateRange}
        refreshDataFunction={refreshDataFunction}
        rawResponse={rawResponse}
      />
    );
  }
  
  // Convert from financial date range to DayPicker format
  const dayPickerDateRange: DateRange = toDayPickerDateRange({
    startDate: (dateRange as {startDate: Date, endDate: Date}).startDate,
    endDate: (dateRange as {startDate: Date, endDate: Date}).endDate
  });

  return (
    <WebhookDebug 
      dateRange={dayPickerDateRange}
      refreshDataFunction={refreshDataFunction}
      rawResponse={rawResponse}
    />
  );
}
