
import { fetchTransactionsFromWebhook } from '@/services/zoho/apiClient';
import { Transaction } from '@/types/financial';

class ZohoRepository {
  private lastFetchedData: {
    transactions: Transaction[];
    raw: any;
  } | null = null;
  
  /**
   * Fetch transactions for a given date range
   */
  async fetchTransactions(
    startDate: Date, 
    endDate: Date,
    forceRefresh: boolean = false
  ): Promise<Transaction[]> {
    try {
      console.log("ZohoRepository: Fetching transactions", { startDate, endDate, forceRefresh });
      
      // Call the webhook directly
      const transactions = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      // Store the last fetched data
      this.lastFetchedData = {
        transactions: Array.isArray(transactions) ? transactions : [],
        raw: transactions
      };
      
      return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
      console.error("ZohoRepository: Error fetching transactions", error);
      return [];
    }
  }
  
  /**
   * Get raw response data from the last fetch operation
   */
  getLastRawResponse(): any {
    return this.lastFetchedData?.raw || null;
  }
  
  /**
   * Get raw response data for a specific date range
   * Added for WebhookDebug component
   */
  async getRawResponse(startDate: Date, endDate: Date): Promise<any> {
    try {
      // We'll just reuse the fetchTransactions method but return the raw data
      await this.fetchTransactions(startDate, endDate, true);
      return this.getLastRawResponse();
    } catch (error) {
      console.error("Error getting raw response:", error);
      return null;
    }
  }
  
  /**
   * Check if the API can connect successfully
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Use current date for a quick test
      const today = new Date();
      const result = await fetchTransactionsFromWebhook(today, today, false);
      return Array.isArray(result) || (result && typeof result === 'object');
    } catch (error) {
      console.error("ZohoRepository: Connectivity check failed", error);
      return false;
    }
  }

  // Method stubs for compatibility
  getTransactions = this.fetchTransactions;
  checkApiConnectivity = this.checkConnectivity;
  getUnpaidInvoices(): any[] {
    return this.lastFetchedData?.raw?.facturas_sin_pagar || [];
  }
  
  // Dummy methods to satisfy interface
  repairCache(): Promise<boolean> {
    console.log("Cache repair no longer supported");
    return Promise.resolve(true);
  }
  
  checkAndRefreshCache(): Promise<boolean> {
    console.log("Cache refresh no longer supported");
    return Promise.resolve(true);
  }
}

export const zohoRepository = new ZohoRepository();
