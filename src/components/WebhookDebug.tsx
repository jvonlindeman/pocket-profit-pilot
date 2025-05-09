
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug } from 'lucide-react';
import ZohoService from '@/services/zohoService';
import WebhookDebugHeader from './WebhookDebug/WebhookDebugHeader';
import WebhookErrorDisplay from './WebhookDebug/WebhookErrorDisplay';
import WebhookTabs from './WebhookDebug/WebhookTabs';
import WebhookLoading from './WebhookDebug/WebhookLoading';

interface WebhookDebugProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshDataFunction?: (forceRefresh: boolean) => void;
  rawResponse?: any;
}

export default function WebhookDebug({ dateRange, refreshDataFunction, rawResponse }: WebhookDebugProps) {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Update local state when rawResponse from parent changes
  useEffect(() => {
    if (rawResponse) {
      setRawData(rawResponse);
      console.log("WebhookDebug: Received rawResponse from parent:", rawResponse);
    }
  }, [rawResponse]);

  // Function to fetch debug data from API
  const fetchDebugData = async () => {
    console.log("WebhookDebug: fetchDebugData called");
    setLoading(true);
    setError(null);
    
    try {
      // First check if there's a global refresh function
      if (refreshDataFunction) {
        console.log("WebhookDebug: Using global refresh function with forceRefresh=true");
        
        try {
          // Always force refresh when button is clicked directly
          await refreshDataFunction(true);
          console.log("WebhookDebug: Global refresh function completed successfully");
          
          // The useEffect above will handle setting rawData from rawResponse
          // Wait a brief moment to ensure the parent component has time to update rawResponse
          await new Promise(resolve => setTimeout(resolve, 250));
          
          // Check if we already have data through rawResponse
          if (rawResponse) {
            console.log("WebhookDebug: Using rawResponse from parent");
            setRawData(rawResponse);
            setLoading(false);
            return;
          }
        } catch (refreshErr: any) {
          console.error("WebhookDebug: Error in global refresh function:", refreshErr);
          // Continue to direct fetch since global refresh failed
          setError(`Error en función de actualización global: ${refreshErr.message || "Error desconocido"}`);
        }
      }
      
      console.log("WebhookDebug: Falling back to direct ZohoService.getRawResponse");
      // Fall back to direct fetch
      try {
        const data = await ZohoService.getRawResponse(dateRange.startDate, dateRange.endDate);
        console.log("WebhookDebug: Direct fetch successful:", data);
        setRawData(data);
      } catch (directErr: any) {
        console.error("WebhookDebug: Error in direct fetch:", directErr);
        throw directErr; // Re-throw to be caught by outer try/catch
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error desconocido al obtener datos";
      console.error("WebhookDebug: Failed to fetch debug data:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Additional function to check cached transaction count
  const checkCacheCount = async () => {
    try {
      const count = await ZohoService.getCachedTransactionCount(
        dateRange.startDate,
        dateRange.endDate
      );
      
      console.log(`WebhookDebug: Found ${count} cached transactions for date range`);
      
      if (count === 0) {
        setError(`No cached transactions found for date range ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}`);
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error("Error checking cache count:", err);
    }
  };

  // Call checkCacheCount when dateRange changes
  useEffect(() => {
    checkCacheCount();
  }, [dateRange.startDate, dateRange.endDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-amber-500" />
          Depuración de Webhook Zoho
        </CardTitle>
        <CardDescription>
          Ver la respuesta cruda del webhook para detectar problemas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WebhookDebugHeader loading={loading} onFetchData={fetchDebugData} />
        <WebhookErrorDisplay error={error} />
        <WebhookLoading loading={loading} />
        
        {!loading && <WebhookTabs rawData={rawData} loading={loading} />}
      </CardContent>
    </Card>
  );
}
