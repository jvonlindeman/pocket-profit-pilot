
import { Transaction, UnpaidInvoice } from "../types/financial";
import { useApiCalls } from "@/contexts/ApiCallsContext";
import { ZohoCacheOperations } from "./zoho/cacheOperations";
import { ZohoApiOperations } from "./zoho/apiOperations";
import { ZohoRequestManager } from "./zoho/requestManager";
import { IRepository } from "./base/IRepository";

/**
 * ZohoRepository handles all data access related to Zoho,
 * with cache-first approach to prevent unnecessary webhook calls
 */
export class ZohoRepository implements IRepository {
  private cacheOps: ZohoCacheOperations;
  private apiOps: ZohoApiOperations;
  private requestManager: ZohoRequestManager;

  constructor() {
    this.cacheOps = new ZohoCacheOperations();
    this.apiOps = new ZohoApiOperations();
    this.requestManager = new ZohoRequestManager(this.cacheOps, this.apiOps);
  }

  /**
   * Set the API calls context for tracking
   */
  setApiCallsContext(context: ReturnType<typeof useApiCalls>) {
    this.apiOps.setApiCallsContext(context);
  }
  
  /**
   * Get transactions for a date range with cache-first approach
   */
  async getTransactions(
    startDate: Date,
    endDate: Date,
    forceRefresh = false
  ): Promise<Transaction[]> {
    try {
      console.log(`🔍 ZohoRepository: Getting transactions from ${startDate.toDateString()} to ${endDate.toDateString()}, forceRefresh: ${forceRefresh}`);
      
      return await this.requestManager.executeTransactionsRequest(startDate, endDate, forceRefresh);
    } catch (error) {
      console.error("❌ ZohoRepository: Error fetching transactions:", error);
      return []; 
    }
  }
  
  /**
   * Get unpaid invoices
   */
  getUnpaidInvoices(): UnpaidInvoice[] {
    return this.apiOps.getUnpaidInvoices();
  }

  /**
   * Get collaborator expenses data
   */
  getCollaboratorExpenses(): any[] {
    return this.apiOps.getCollaboratorExpenses();
  }

  /**
   * Return the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.apiOps.getLastRawResponse();
  }

  /**
   * Get raw response data directly with cache-first approach
   */
  async getRawResponse(startDate: Date, endDate: Date, forceRefresh = false): Promise<any> {
    try {
      console.log("🔍 ZohoRepository: Fetching raw response for", startDate.toDateString(), "to", endDate.toDateString());
      
      return await this.requestManager.executeRawResponseRequest(startDate, endDate, forceRefresh);
    } catch (error) {
      console.error("❌ ZohoRepository: Error fetching raw response:", error);
      return { error: error.message || "Unknown error" };
    }
  }

  /**
   * Check if API is accessible with minimal cache
   */
  async checkApiConnectivity(): Promise<boolean> {
    return await this.apiOps.checkConnectivity();
  }
}

// Export a singleton instance
export const zohoRepository = new ZohoRepository();
