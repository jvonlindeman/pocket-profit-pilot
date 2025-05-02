
import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// The make.com webhook URL
const makeWebhookUrl = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

// Helper function to get the current year
const getCurrentYear = () => new Date().getFullYear();

// Helper function to ensure valid date format
const ensureValidDateFormat = (dateStr: string) => {
  try {
    // Check if the date string is already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse the date and format it as YYYY-MM-DD
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // If we can't parse it, use the current date
    console.warn(`Invalid date format detected: ${dateStr}, using current date instead`);
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error(`Error processing date: ${dateStr}`, error);
    return new Date().toISOString().split('T')[0];
  }
};

// Helper function to handle API errors and provide better user feedback
const handleApiError = (error: any, message: string) => {
  console.error(`ZohoService error: ${message}`, error);
  
  let errorMessage = message;
  
  // Extract more specific error messages from the response if available
  if (error?.details) {
    if (typeof error.details === 'string') {
      // Check for common errors
      if (error.details.includes('domain')) {
        errorMessage = 'Error al comunicarse con make.com. Por favor, intente de nuevo más tarde.';
      } else if (error.details.includes('invalid_organization')) {
        errorMessage = 'Error de configuración. Por favor, contacte al administrador.';
      } else if (error.details.includes('invalid_token')) {
        errorMessage = 'Error de autenticación con Zoho Books. Por favor, contacte al administrador.';
      } else if (error.details.includes('<!DOCTYPE html>')) {
        errorMessage = 'Error de comunicación con make.com. Por favor, intente de nuevo más tarde.';
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
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date, forceRefresh = false): Promise<Transaction[]> => {
    try {
      console.log("ZohoService: Fetching transactions from", startDate, "to", endDate);
      
      // Format dates for the make.com webhook (YYYY-MM-DD format)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Call the make.com webhook directly
      console.log("ZohoService: Calling make.com webhook:", makeWebhookUrl);
      const response = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getTransactions",
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          forceRefresh
        })
      });
      
      console.log(`make.com webhook response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch data from make.com webhook:", errorText);
        
        const errorMessage = handleApiError({details: errorText}, 'Failed to fetch Zoho transactions from make.com webhook');
        console.warn('Falling back to mock data due to error');
        return ZohoService.getMockTransactions(startDate, endDate);
      }
      
      // Parse the webhook response
      let data;
      try {
        const responseText = await response.text();
        if (!responseText || responseText === "Accepted") {
          console.log("Empty or 'Accepted' response from make.com webhook, using mock data");
          return ZohoService.getMockTransactions(startDate, endDate);
        }
        
        console.log(`make.com webhook response: ${responseText}`);
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse make.com webhook response:", e);
        return ZohoService.getMockTransactions(startDate, endDate);
      }
      
      console.log("ZohoService: Received data from make.com webhook:", data);
      
      // Process the data to ensure valid date formats
      const processedData = Array.isArray(data) ? data.map((item: any) => {
        // Ensure the item has all required fields
        if (!item.id) item.id = `zoho-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (!item.date) item.date = new Date().toISOString().split('T')[0];
        else item.date = ensureValidDateFormat(item.date);
        if (!item.type) item.type = 'income'; // Default type
        if (!item.category) item.category = 'Uncategorized';
        if (!item.description && item.customer_name) item.description = `Transacción de ${item.customer_name}`;
        if (!item.description) item.description = 'Sin descripción';
        if (!item.source) item.source = 'Zoho';
        
        return item as Transaction;
      }) : [];
      
      return processedData;
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
