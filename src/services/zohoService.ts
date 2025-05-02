
import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Interface for ZohoService configuration status
export interface ZohoServiceStatus {
  isConfigured: boolean;
  lastUpdated?: string;
}

// Helper function to get the current year
const getCurrentYear = () => new Date().getFullYear();

// Helper function to handle API errors and provide better user feedback
const handleApiError = (error: any, message: string) => {
  console.error(`ZohoService error: ${message}`, error);
  
  let errorMessage = message;
  
  // Extract more specific error messages from the response if available
  if (error?.details) {
    if (typeof error.details === 'string') {
      // Check for common errors
      if (error.details.includes('domain')) {
        errorMessage = 'Error al comunicarse con make.com. Por favor, verifique su configuración.';
      } else if (error.details.includes('invalid_organization')) {
        errorMessage = 'El Organization ID es inválido. Verifíquelo en su cuenta de Zoho Books.';
      } else if (error.details.includes('invalid_token')) {
        errorMessage = 'El token de acceso es inválido o ha expirado. Por favor, regenere su Refresh Token con el scope ZohoBooks.fullaccess.all.';
      } else if (error.details.includes('<!DOCTYPE html>')) {
        errorMessage = 'El webhook ha devuelto una página HTML en lugar de JSON. Verifique la configuración de make.com.';
      } else if (error?.message) {
        errorMessage = `${message}: ${error.message}`;
      }
    }
  }
  
  toast({
    title: 'Error de Zoho Books',
    description: errorMessage,
    variant: 'destructive'
  });
  
  return errorMessage;
};

// Implementation that connects to Zoho Books API via make.com webhook
const ZohoService = {
  // Get configuration status
  getStatus: async (): Promise<ZohoServiceStatus> => {
    try {
      console.log("ZohoService: Getting configuration status");
      const { data, error } = await supabase.functions.invoke('zoho-config', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error getting Zoho configuration status:', error);
        return { isConfigured: false };
      }
      
      return {
        isConfigured: data.configured,
        lastUpdated: data.config?.updatedAt
      };
    } catch (err) {
      console.error('Error in getStatus:', err);
      return { isConfigured: false };
    }
  },

  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date, forceRefresh = false): Promise<Transaction[]> => {
    try {
      console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
      
      // Check if Zoho is configured
      const status = await ZohoService.getStatus();
      
      if (!status.isConfigured) {
        console.warn('Zoho Books is not configured. Using mock data.');
        return ZohoService.getMockTransactions(startDate, endDate);
      }
      
      // Call our edge function to get transactions via make.com webhook
      console.log("ZohoService: Calling zoho-transactions edge function");
      const { data, error } = await supabase.functions.invoke('zoho-transactions', {
        method: 'POST',
        body: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          forceRefresh
        }
      });
      
      if (error) {
        const errorMessage = handleApiError(error, 'Failed to fetch Zoho transactions from make.com webhook');
        console.warn('Falling back to mock data due to error');
        return ZohoService.getMockTransactions(startDate, endDate);
      }
      
      console.log("ZohoService: Received data from make.com webhook:", data);
      return data as Transaction[];
    } catch (err) {
      handleApiError(err, 'Failed to connect to make.com webhook');
      // Fall back to mock data
      console.warn('Falling back to mock data due to exception');
      return ZohoService.getMockTransactions(startDate, endDate);
    }
  },
  
  // Force refresh transactions and bypass cache
  forceRefresh: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    console.log("ZohoService: Force refreshing transactions from", startDate, "to", endDate);
    return ZohoService.getTransactions(startDate, endDate, true);
  },
  
  // Mock data for fallback when API fails or for development
  getMockTransactions: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    // Original mock data with updated years
    const zohoMockData: Transaction[] = [
      {
        id: "zoho-1",
        date: `${getCurrentYear()}-05-01`,
        amount: 2500,
        description: "Cliente ABC - Servicio de marketing",
        category: "Ingresos por servicio",
        source: "Zoho",
        type: "income"
      },
      {
        id: "zoho-2",
        date: `${getCurrentYear()}-05-05`,
        amount: 1200,
        description: "Cliente XYZ - Consultoría",
        category: "Ingresos por consultoría",
        source: "Zoho",
        type: "income"
      },
      {
        id: "zoho-3",
        date: `${getCurrentYear()}-05-07`,
        amount: 350,
        description: "Suscripción Adobe",
        category: "software",
        source: "Zoho",
        type: "expense"
      },
      {
        id: "zoho-4",
        date: `${getCurrentYear()}-05-10`,
        amount: 780,
        description: "Pago a diseñador freelance",
        category: "personal",
        source: "Zoho",
        type: "expense"
      },
      {
        id: "zoho-5",
        date: `${getCurrentYear()}-05-15`,
        amount: 1500,
        description: "Cliente DEF - Servicio mensual",
        category: "Ingresos recurrentes",
        source: "Zoho",
        type: "income"
      },
      {
        id: "zoho-6",
        date: `${getCurrentYear()}-05-18`,
        amount: 250,
        description: "Suscripción herramientas de análisis",
        category: "tools",
        source: "Zoho",
        type: "expense"
      },
      {
        id: "zoho-7",
        date: `${getCurrentYear()}-05-20`,
        amount: 2000,
        description: "Pago de salarios",
        category: "personal",
        source: "Zoho",
        type: "expense"
      }
    ];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log("ZohoService mock: Filtering transactions from", startDate, "to", endDate);

    // Filter the transactions by date
    const filtered = zohoMockData.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
    
    console.log("ZohoService mock: Found transactions:", filtered.length);
    
    return filtered;
  }
};

export default ZohoService;
