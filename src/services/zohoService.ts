
import { Transaction } from "../types/financial";
import { fetchTransactionsFromWebhook } from "./zoho/apiClient";
import { getMockTransactions } from "./zoho/mockData";

// Variable para almacenar la última respuesta cruda del webhook
let lastRawResponse: any = null;

// Implementation that connects to Zoho Books API via make.com webhook
const ZohoService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date, forceRefresh = false): Promise<Transaction[]> => {
    try {
      // First get the raw response for debugging
      const rawResponse = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      
      // Store the raw response for debugging regardless of whether it has errors
      if (rawResponse) {
        console.log("ZohoService: Storing raw response for debug purposes");
        lastRawResponse = rawResponse;
      }
      
      // Process transactions normally
      // If there was an error in the raw response, this will return mock data as a fallback
      return await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
    } catch (error) {
      console.error("ZohoService: Error in getTransactions", error);
      // Ensure we have something in lastRawResponse for debugging
      if (!lastRawResponse) {
        lastRawResponse = { error: error instanceof Error ? error.message : "Unknown error" };
      }
      return getMockTransactions(startDate, endDate);
    }
  },
  
  // Force refresh transactions and bypass cache
  forceRefresh: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    console.log("ZohoService: Force refreshing transactions from", startDate, "to", endDate);
    try {
      // First get the raw response for debugging
      const rawResponse = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
      
      // Store the raw response
      if (rawResponse) {
        lastRawResponse = rawResponse;
      }
      
      return fetchTransactionsFromWebhook(startDate, endDate, true);
    } catch (error) {
      console.error("ZohoService: Error in forceRefresh", error);
      if (!lastRawResponse) {
        lastRawResponse = { error: error instanceof Error ? error.message : "Unknown error" };
      }
      return getMockTransactions(startDate, endDate);
    }
  },
  
  // Get raw webhook response data for debugging
  getRawResponse: async (startDate: Date, endDate: Date): Promise<any> => {
    console.log("ZohoService: Getting raw response data for debugging");
    
    // Si tenemos una respuesta guardada, la devolvemos
    if (lastRawResponse) {
      console.log("ZohoService: Returning cached raw response");
      return lastRawResponse;
    }
    
    // Si no hay respuesta guardada, obtenemos una nueva
    try {
      const response = await fetchTransactionsFromWebhook(startDate, endDate, true, true);
      lastRawResponse = response;
      return response;
    } catch (error) {
      console.error("ZohoService: Error getting raw response", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
  
  // Obtener la última respuesta cruda sin hacer ninguna llamada
  getLastRawResponse: (): any => {
    return lastRawResponse;
  },
  
  // Establecer la respuesta cruda manualmente (útil para actualizar desde componentes)
  setLastRawResponse: (data: any): void => {
    lastRawResponse = data;
  },
  
  // Mock data for fallback when API fails or for development
  getMockTransactions
};

export default ZohoService;
