
import { useState, useEffect } from 'react';
import * as ZohoService from '@/services/zohoService';
import { DateRange } from 'react-day-picker';
import { toFinancialDateRange } from '@/utils/dateRangeAdapter';

interface WebhookDebugHookProps {
  dateRange: DateRange;
  refreshDataFunction?: (forceRefresh: boolean) => void;
  initialRawResponse?: any;
}

interface WebhookDebugState {
  loading: boolean;
  rawData: any;
  error: string | null;
  configIssue: boolean;
}

export function useWebhookDebug({ 
  dateRange, 
  refreshDataFunction, 
  initialRawResponse 
}: WebhookDebugHookProps) {
  const [state, setState] = useState<WebhookDebugState>({
    loading: false,
    rawData: initialRawResponse || null,
    error: null,
    configIssue: false
  });

  // Update rawData when initialRawResponse changes from parent
  useEffect(() => {
    if (initialRawResponse) {
      setState(prevState => ({
        ...prevState,
        rawData: initialRawResponse,
        configIssue: detectConfigurationIssues(initialRawResponse)
      }));
      console.log("useWebhookDebug: Received initialRawResponse:", initialRawResponse);
    }
  }, [initialRawResponse]);

  // Detect webhook configuration issues in the response
  const detectConfigurationIssues = (data: any): boolean => {
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
    
    return hasConfigIssue;
  };

  // Function to fetch raw webhook data
  const fetchDebugData = async () => {
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // First update data using the global refresh function if available
      if (refreshDataFunction) {
        console.log("Using global refresh function to load data");
        refreshDataFunction(true);
        
        // Wait a brief moment for the update to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Convert from DayPicker format to Financial format
      const financialDateRange = toFinancialDateRange(dateRange);
      
      // Get raw data to show in the debug UI
      const data = await ZohoService.getRawResponse(
        financialDateRange.startDate, 
        financialDateRange.endDate
      );
      
      const hasConfigIssue = detectConfigurationIssues(data);
      
      setState({
        loading: false,
        rawData: data,
        error: null,
        configIssue: hasConfigIssue
      });
      
      console.log("Debug data received:", data);
      return data;
    } catch (err: any) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: err.message || "Error desconocido"
      }));
      console.error("Failed to fetch debug data:", err);
      throw err;
    }
  };

  // Check if webhook has usable data
  const hasUsableData = (data: any): boolean => {
    if (!data) return false;
    
    // Check for common webhook data structures
    const hasPayments = Array.isArray(data.payments) && data.payments.length > 0;
    const hasExpenses = Array.isArray(data.expenses) && data.expenses.length > 0;
    const hasCollaborators = Array.isArray(data.colaboradores) && data.colaboradores.length > 0;
    const hasCachedTransactions = Array.isArray(data.cached_transactions) && data.cached_transactions.length > 0;
    
    return hasPayments || hasExpenses || hasCollaborators || hasCachedTransactions;
  };

  return {
    ...state,
    fetchDebugData,
    hasUsableData
  };
}
