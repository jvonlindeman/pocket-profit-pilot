
import { fetchTransactionsFromWebhook } from '@/services/zoho/apiClient';
import { Transaction } from '@/types/financial';
import { UnpaidInvoice } from '@/services/zoho/api/types';

class ZohoRepository {
  private lastFetchedData: {
    transactions: Transaction[];
    raw: any;
    unpaidInvoices: UnpaidInvoice[];
    fetchTime: number;
    startDate?: Date;
    endDate?: Date;
  } | null = null;
  
  // Increase cache duration to 15 minutes (15 * 60 * 1000)
  private readonly CACHE_DURATION = 15 * 60 * 1000;
  
  /**
   * Check if we have a valid cached response for the given date range
   */
  private hasCachedResponse(startDate: Date, endDate: Date): boolean {
    if (!this.lastFetchedData) return false;
    
    const now = Date.now();
    const cacheAge = now - this.lastFetchedData.fetchTime;
    
    // If cache is too old, don't use it
    if (cacheAge > this.CACHE_DURATION) {
      console.log("ZohoRepository: Cache expired, fetching new data");
      return false;
    }
    
    // If date range is different, don't use cache
    if (this.lastFetchedData.startDate && this.lastFetchedData.endDate) {
      if (this.lastFetchedData.startDate.getTime() !== startDate.getTime() || 
          this.lastFetchedData.endDate.getTime() !== endDate.getTime()) {
        console.log("ZohoRepository: Date range changed, fetching new data");
        return false;
      }
    }
    
    console.log("ZohoRepository: Using cached data");
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
      console.log("ZohoRepository: fetchTransactions called with", { 
        startDate, 
        endDate, 
        forceRefresh,
        hasCachedData: this.hasCachedResponse(startDate, endDate)
      });
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && this.hasCachedResponse(startDate, endDate)) {
        console.log("ZohoRepository: Using cached transactions data");
        return this.lastFetchedData?.transactions || [];
      }
      
      // Call the webhook directly
      const response = await fetchTransactionsFromWebhook(startDate, endDate, forceRefresh);
      
      // Extract transactions and unpaid invoices
      const transactions = Array.isArray(response.cached_transactions) 
        ? response.cached_transactions 
        : [];
      
      const unpaidInvoices = Array.isArray(response.facturas_sin_pagar) 
        ? response.facturas_sin_pagar 
        : [];
      
      // Store the last fetched data with timestamp
      this.lastFetchedData = {
        transactions,
        raw: response,
        unpaidInvoices,
        fetchTime: Date.now(),
        startDate,
        endDate
      };
      
      console.log("ZohoRepository: Successfully fetched and cached new data", {
        transactionsCount: transactions.length,
        unpaidInvoicesCount: unpaidInvoices.length
      });
      
      return transactions;
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
      console.log("ZohoRepository: getRawResponse called with", { 
        startDate, 
        endDate, 
        forceRefresh,
        hasCachedData: this.hasCachedResponse(startDate, endDate)
      });
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && this.hasCachedResponse(startDate, endDate)) {
        console.log("ZohoRepository: Using cached raw response data");
        return this.lastFetchedData?.raw || null;
      }
      
      // We'll fetch from the webhook and populate our cache
      await this.fetchTransactions(startDate, endDate, true);
      return this.lastFetchedData?.raw || null;
    } catch (error) {
      console.error("ZohoRepository: Error getting raw response:", error);
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
      return result && typeof result === 'object';
    } catch (error) {
      console.error("ZohoRepository: Connectivity check failed", error);
      return false;
    }
  }

  /**
   * Get unpaid invoices from the last fetched data
   * If no data is cached, can fetch from API
   */
  async getUnpaidInvoices(startDate?: Date, endDate?: Date): Promise<UnpaidInvoice[]> {
    try {
      // If dates are provided, check if we need to fetch new data
      if (startDate && endDate) {
        if (!this.hasCachedResponse(startDate, endDate)) {
          console.log("ZohoRepository: Fetching data to get unpaid invoices");
          await this.fetchTransactions(startDate, endDate, false);
        }
      }
      
      // Return the unpaid invoices from cache
      return this.lastFetchedData?.unpaidInvoices || [];
    } catch (error) {
      console.error("ZohoRepository: Error getting unpaid invoices", error);
      return [];
    }
  }
}

export const zohoRepository = new ZohoRepository();
