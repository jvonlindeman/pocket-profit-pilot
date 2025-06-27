
import { Transaction, UnpaidInvoice } from "../../types/financial";
import * as zohoApiClient from "../../services/zoho/apiClient";
import { formatDateYYYYMMDD } from "../../utils/dateUtils";
import { apiRequestManager } from "../../utils/ApiRequestManager";

/**
 * Handles all API-related operations for Zoho data
 */
export class ZohoApiOperations {
  private lastRawResponse: any = null;
  private unpaidInvoices: UnpaidInvoice[] = [];
  private collaboratorExpenses: any[] = [];
  private apiCallsContext?: any;
  private webhooksDisabled = false;

  /**
   * Set the API calls context for tracking
   */
  setApiCallsContext(context: any) {
    this.apiCallsContext = context;
  }

  /**
   * Set webhook prevention flag
   */
  setWebhooksDisabled(disabled: boolean) {
    this.webhooksDisabled = disabled;
    console.log(`🔧 ZohoApiOperations: Webhooks ${disabled ? 'DISABLED' : 'ENABLED'}`);
  }

  /**
   * Track API call
   */
  private trackApiCall() {
    if (this.apiCallsContext) {
      this.apiCallsContext.incrementZohoApiCalls();
    }
  }

  /**
   * Check if webhooks should be prevented
   */
  private shouldPreventWebhook(): boolean {
    if (this.webhooksDisabled) {
      console.warn("🚫 ZohoApiOperations: WEBHOOK CALL PREVENTED - Webhooks are disabled");
      return true;
    }
    return false;
  }

  /**
   * Execute the actual transactions request with webhook call tracking
   */
  async executeTransactionsRequest(
    cacheKey: string,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<Transaction[]> {
    if (this.shouldPreventWebhook()) {
      console.warn("🚫 ZohoApiOperations: WEBHOOK CALL BLOCKED - Returning empty array");
      return [];
    }

    console.log(`🚀 ZohoApiOperations: WEBHOOK CALL STARTING - Making actual API request for ${cacheKey}`);
    console.log(`📡 WEBHOOK CALL: Zoho webhook will be called for date range ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    // Track the API call
    this.trackApiCall();
    
    // Use the unified API client gateway function
    const response = await zohoApiClient.fetchZohoData(startDate, endDate, forceRefresh);
    
    console.log(`📡 WEBHOOK CALL COMPLETED: Zoho webhook call finished for ${cacheKey}`);
    
    // Store the raw response for debugging
    this.lastRawResponse = response;
    
    let transactions: Transaction[] = [];
    
    if (Array.isArray(response)) {
      // If the response is already an array of Transaction objects
      console.log(`📊 ZohoApiOperations: Received ${response.length} already processed Zoho transactions`);
      transactions = response;
    } 
    else if (response && typeof response === 'object') {
      if (response.cached_transactions && Array.isArray(response.cached_transactions)) {
        // If we received a structured response with transactions inside
        console.log(`📋 ZohoApiOperations: Received ${response.cached_transactions.length} cached Zoho transactions`);
        transactions = response.cached_transactions;
      } 
      else {
        // Process the raw response through our processor
        console.log("⚙️ ZohoApiOperations: Processing raw Zoho response data");
        const processed = zohoApiClient.processTransactionResponse(response);
        transactions = processed;
        
        // Also process unpaid invoices if available
        this.unpaidInvoices = zohoApiClient.processUnpaidInvoicesResponse(response);
        
        // Process collaborator data if available
        if (response.colaboradores && Array.isArray(response.colaboradores)) {
          this.collaboratorExpenses = response.colaboradores;
          console.log(`👥 ZohoApiOperations: Processed ${this.collaboratorExpenses.length} collaborator expenses`);
        }
        
        console.log(`📋 ZohoApiOperations: Processed ${this.unpaidInvoices.length} unpaid invoices`);
      }
    }
    
    console.log(`✅ ZohoApiOperations: WEBHOOK CALL RESULT - Final transaction count: ${transactions.length}`);
    return transactions;
  }

  /**
   * Execute the actual raw response request
   */
  async executeRawResponseRequest(
    cacheKey: string,
    startDate: Date,
    endDate: Date,
    forceRefresh: boolean
  ): Promise<any> {
    if (this.shouldPreventWebhook()) {
      console.warn("🚫 ZohoApiOperations: RAW WEBHOOK CALL BLOCKED - Returning empty object");
      return { error: "Webhooks disabled" };
    }

    console.log(`🚀 ZohoApiOperations: RAW WEBHOOK CALL STARTING - Making raw API request for ${cacheKey}`);
    console.log(`📡 WEBHOOK CALL: Zoho raw webhook will be called for date range ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    // Track the API call
    this.trackApiCall();
    
    // Fetch raw data
    const rawData = await zohoApiClient.fetchZohoData(startDate, endDate, forceRefresh, true);
    this.lastRawResponse = rawData;
    
    console.log(`📡 WEBHOOK CALL COMPLETED: Zoho raw webhook call finished for ${cacheKey}`);
    return rawData;
  }

  /**
   * Check API connectivity
   */
  async checkConnectivity(): Promise<boolean> {
    if (this.shouldPreventWebhook()) {
      console.warn("🚫 ZohoApiOperations: CONNECTIVITY CHECK BLOCKED - Returning false");
      return false;
    }

    try {
      // Use a fixed cache key for connectivity checks with long cooldown
      const cacheKey = `zoho-connectivity-check`;
      
      return await apiRequestManager.executeRequest(
        cacheKey,
        async () => {
          console.log(`🔌 ZohoApiOperations: CONNECTIVITY WEBHOOK CALL STARTING - Checking API connectivity`);
          console.log(`📡 WEBHOOK CALL: Zoho connectivity webhook will be called`);
          
          // Track the API call
          this.trackApiCall();
          
          // Use the main fetch function with minimal data to check connectivity
          const response = await zohoApiClient.fetchZohoData(
            new Date(), 
            new Date(),
            false,
            true
          );
          
          console.log(`📡 WEBHOOK CALL COMPLETED: Zoho connectivity webhook call finished`);
          return !!response && !response.error;
        },
        5 * 60 * 1000, // 5 minute TTL for connectivity checks
        30000   // 30 second cooldown
      );
    } catch {
      console.log(`❌ WEBHOOK CALL FAILED: Zoho connectivity check failed`);
      return false;
    }
  }

  /**
   * Get the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse;
  }

  /**
   * Get unpaid invoices
   */
  getUnpaidInvoices(): UnpaidInvoice[] {
    return this.unpaidInvoices;
  }

  /**
   * Get collaborator expenses data
   */
  getCollaboratorExpenses(): any[] {
    return this.collaboratorExpenses;
  }
}
