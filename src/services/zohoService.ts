
import { Transaction } from "../types/financial";
import { fetchTransactionsFromWebhook } from "./zoho/apiClient";
import { getMockTransactions } from "./zoho/mockData";

// Variable para almacenar la última respuesta cruda del webhook
let lastRawResponse: any = null;

// Implementation that connects to Zoho Books API via make.com webhook
const ZohoService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date, forceRefresh = false): Promise<Transaction[]> => {
    // Obtener datos y guardar la respuesta cruda
    const response = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
    lastRawResponse = response;
    
    // Procesar las transacciones normalmente
    return fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
  },
  
  // Force refresh transactions and bypass cache
  forceRefresh: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    console.log("ZohoService: Force refreshing transactions from", startDate, "to", endDate);
    return fetchTransactionsFromWebhook(startDate, endDate, true);
  },
  
  // Get raw webhook response data for debugging
  getRawResponse: async (startDate: Date, endDate: Date): Promise<any> => {
    console.log("ZohoService: Getting raw response data for debugging");
    
    // Si tenemos una respuesta guardada, la devolvemos
    if (lastRawResponse) {
      console.log("ZohoService: Returning cached raw response");
      const cachedResponse = lastRawResponse;
      return cachedResponse;
    }
    
    // Si no hay respuesta guardada, obtenemos una nueva
    return fetchTransactionsFromWebhook(startDate, endDate, true, true);
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
