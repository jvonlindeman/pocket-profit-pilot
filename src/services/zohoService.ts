
import { Transaction } from "../types/financial";
import * as zohoApiClient from "./zoho/apiClient";

let lastRawResponse: any = null;

// Export all functions as named exports
export const getTransactions = async (
  startDate: Date,
  endDate: Date,
  forceRefresh = false
): Promise<Transaction[]> => {
  try {
    // Call the real implementation
    const transactions = await fetchTransactionsFromSource(startDate, endDate, forceRefresh);
    return transactions;
  } catch (error) {
    console.error("Error in getTransactions:", error);
    return []; // Return an empty array in case of error
  }
};

// Implement the actual function to fetch transactions
export async function fetchTransactionsFromSource(
  startDate: Date,
  endDate: Date,
  forceRefresh = false
): Promise<Transaction[]> {
  try {
    console.log("Fetching Zoho transactions from", startDate, "to", endDate);
    const response = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
    
    // Store the raw response for debugging
    if (response && typeof response === 'object') {
      lastRawResponse = response;
    }
    
    // If the response is already an array of Transaction objects, return it
    if (Array.isArray(response) && response.length > 0 && 'type' in response[0] && 'source' in response[0]) {
      console.log(`Received ${response.length} processed Zoho transactions`);
      return response;
    } 
    
    // If we received a structured response with transactions inside
    if (response && typeof response === 'object') {
      if (response.cached_transactions && Array.isArray(response.cached_transactions)) {
        console.log(`Received ${response.cached_transactions.length} cached Zoho transactions`);
        return response.cached_transactions;
      }
    }
    
    console.log("No valid Zoho transactions found in response");
    return [];
  } catch (error) {
    console.error("Error fetching transactions from Zoho:", error);
    throw error; // Rethrow to let the caller handle it
  }
};

// Return the last raw response for debugging
export const getLastRawResponse = (): any => lastRawResponse;

// Get raw response data directly (for debugging purposes)
export const getRawResponse = async (startDate: Date, endDate: Date): Promise<any> => {
  try {
    const rawData = await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, false, true);
    lastRawResponse = rawData;
    return rawData;
  } catch (error) {
    console.error("Error fetching raw Zoho response:", error);
    return { error: error.message || "Unknown error" };
  }
};

// Add other methods that might be needed
export const checkApiConnectivity = async (): Promise<boolean> => {
  try {
    // Simple connectivity check - just try to get a minimal response
    const response = await zohoApiClient.fetchTransactionsFromWebhook(
      new Date(), 
      new Date(),
      false,
      true
    );
    return !!response && !response.error;
  } catch {
    return false;
  }
};

export const repairCache = async (startDate: Date, endDate: Date): Promise<boolean> => {
  try {
    // Force refresh to repair the cache
    await zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, true);
    return true;
  } catch {
    return false;
  }
};

export const checkAndRefreshCache = async (startDate: Date, endDate: Date): Promise<void> => {
  try {
    // This would trigger a background refresh of the cache if needed
    console.log("Background refresh of Zoho cache initiated");
    zohoApiClient.fetchTransactionsFromWebhook(startDate, endDate, true)
      .then(() => console.log("Background Zoho cache refresh completed"))
      .catch(err => console.error("Background Zoho cache refresh failed:", err));
  } catch (error) {
    console.error("Error checking/refreshing Zoho cache:", error);
  }
};
