
import { fetchTransactionsFromWebhook } from '@/services/zoho/apiClient';
import { Transaction } from '@/types/financial';
import { UnpaidInvoice } from '@/services/zoho/api/types';

class ZohoRepository {
  private lastFetchedData: {
    transactions: Transaction[];
    raw: any;
    fetchTime: number;
    startDate?: Date;
    endDate?: Date;
  } | null = null;
  
  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  
  /**
   * Check if we have a valid cached response for the given date range
   */
  private hasCachedResponse(startDate: Date, endDate: Date): boolean {
    if (!this.lastFetchedData) return false;
    
    const now = Date.now();
    const cacheAge = now - this.lastFetchedData.fetchTime;
    
    // If cache is too old, don't use it
    if (cacheAge > this.CACHE_DURATION) return false;
    
    // If date range is different, don't use cache
    if (this.lastFetchedData.startDate && this.lastFetchedData.endDate) {
      if (this.lastFetchedData.startDate.getTime() !== startDate.getTime() || 
          this.lastFetchedData.endDate.getTime() !== endDate.getTime()) {
        return false;
      }
    }
    
    return true;
  }
  
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
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && this.hasCachedResponse(startDate, endDate)) {
        console.log("ZohoRepository: Using cached transactions data");
        return this.lastFetchedData?.transactions || [];
      }
      
      // Call the webhook directly
      const transactions = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      // Store the last fetched data with timestamp
      this.lastFetchedData = {
        transactions: Array.isArray(transactions) ? transactions : [],
        raw: transactions,
        fetchTime: Date.now(),
        startDate,
        endDate
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
  async getRawResponse(startDate: Date, endDate: Date, forceRefresh: boolean = false): Promise<any> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh && this.hasCachedResponse(startDate, endDate)) {
        console.log("ZohoRepository: Using cached raw response data");
        return this.lastFetchedData?.raw || null;
      }
      
      console.log("ZohoRepository: Fetching raw response data from webhook");
      // We'll directly fetch from the webhook with returnRawResponse=true
      const rawData = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh, true);
      
      // Update cache
      this.lastFetchedData = {
        transactions: [],  // We don't have processed transactions here
        raw: rawData,
        fetchTime: Date.now(),
        startDate,
        endDate
      };
      
      return rawData;
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

  /**
   * Get unpaid invoices from the last fetched data
   */
  getUnpaidInvoices(): UnpaidInvoice[] {
    return this.lastFetchedData?.raw?.facturas_sin_pagar || [];
  }
}

export const zohoRepository = new ZohoRepository();
