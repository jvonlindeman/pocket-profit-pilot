
import React, { useState, useEffect } from 'react';
import WebhookDebug from './WebhookDebug/index'; // Import the refactored component
import { DateRange } from 'react-day-picker';

interface WebhookDebugLegacyProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any;
}

// Legacy wrapper to maintain backward compatibility
export default function WebhookDebugLegacy({ 
  dateRange, 
  refreshDataFunction,
  rawResponse 
}: WebhookDebugLegacyProps) {
  // Convert from financial date range to DayPicker format
  const dayPickerDateRange: DateRange = {
    from: dateRange.startDate,
    to: dateRange.endDate
  };

  return (
    <WebhookDebug 
      dateRange={dayPickerDateRange}
      refreshDataFunction={refreshDataFunction}
      rawResponse={rawResponse}
    />
  );
}
