import { Transaction, FinancialData } from "../types/financial";
import { zohoRepository } from "../repositories/zohoRepository";
import { stripeRepository } from "../repositories/stripeRepository";
import CacheService from "../services/cache";
import { toast } from "@/hooks/use-toast";
import { financialSummaryService } from "./financialSummaryService";
import { apiRequestManager } from "@/utils/ApiRequestManager";

export interface FinancialDataCallbacks {
  onTransactions: (transactions: Transaction[]) => void;
  onCollaboratorData: (data: any) => void;
  onIncomeTypes: (transactions: Transaction[], stripeData: any) => void;
}

/**
 * Service to handle financial data processing and aggregation from multiple sources
 */
export class FinancialService {
  private lastFetchTimestamp = 0;
  private lastRawResponse: any = null;
  private apiConnectivityStatus: {zoho: boolean, stripe: boolean} | null = null;
  
  /**
   * Get the last raw response for debugging
   */
  getLastRawResponse(): any {
    return this.lastRawResponse;
  }
  
  /**
   * Process transaction data to calculate financial metrics
   */
  processTransactionData(transactions: Transaction[], startingBalance: number = 0, collaboratorExpenses: any[] = []): FinancialData {
    console.log("Processing transaction data with collaborator expenses:", collaboratorExpenses);
    
    // Calculate total collaborator expense from the collaboratorExpenses array
    // with improved logging and error handling
    const collaboratorExpense = Array.isArray(collaboratorExpenses) 
      ? collaboratorExpenses.reduce((sum, item) => {
          if (!item || typeof item !== 'object') {
            console.warn("Invalid collaborator expense item:", item);
            return sum;
          }
          const amount = typeof item.amount === 'number' ? item.amount : 0;
          console.log(`Adding collaborator expense: ${item.category || 'unnamed'} - $${amount}`);
          return sum + amount;
        }, 0)
      : 0;
    
    console.log("Total collaborator expense calculated:", collaboratorExpense);
    
    // Calculate income and expenses from transactions
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const summary = {
      totalIncome,
      totalExpense,
      collaboratorExpense,
      otherExpense: totalExpense - collaboratorExpense,
      profit: totalIncome - totalExpense,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
      grossProfit: totalIncome,
      grossProfitMargin: totalIncome > 0 ? 100 : 0,
      startingBalance,
    };
    
    console.log("Final financial summary:", summary);
    
    // Process income and expense data by category
    const incomeBySource: any[] = [];
    const expenseByCategory: any[] = [];
    
    // Group transactions by category
    const expenseCategories: Record<string, {amount: number, count: number}> = {};
    const incomeCategories: Record<string, {amount: number, count: number}> = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      
      if (transaction.type === 'expense') {
        if (!expenseCategories[category]) {
          expenseCategories[category] = { amount: 0, count: 0 };
        }
        expenseCategories[category].amount += transaction.amount;
        expenseCategories[category].count += 1;
      } else {
        if (!incomeCategories[category]) {
          incomeCategories[category] = { amount: 0, count: 0 };
        }
        incomeCategories[category].amount += transaction.amount;
        incomeCategories[category].count += 1;
      }
    });
    
    // Convert expense categories to array
    Object.entries(expenseCategories).forEach(([category, data]) => {
      expenseByCategory.push({
        category,
        amount: data.amount,
        percentage: summary.totalExpense > 0 ? (data.amount / summary.totalExpense) * 100 : 0,
        count: data.count
      });
    });
    
    // Convert income categories to array
    Object.entries(incomeCategories).forEach(([category, data]) => {
      incomeBySource.push({
        category,
        amount: data.amount,
        percentage: summary.totalIncome > 0 ? (data.amount / summary.totalIncome) * 100 : 0,
        count: data.count
      });
    });
    
    // Sort by amount (highest first)
    expenseByCategory.sort((a, b) => b.amount - a.amount);
    incomeBySource.sort((a, b) => b.amount - a.amount);
    
    // Add daily and monthly data placeholders
    // In a real implementation, we would calculate these values
    const dailyData = {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] }
    };
    
    const monthlyData = {
      income: { labels: [], values: [] },
      expense: { labels: [], values: [] },
      profit: { labels: [], values: [] }
    };
    
    return {
      summary,
      transactions,
      incomeBySource,
      expenseByCategory,
      dailyData,
      monthlyData
    };
  }

  /**
   * Check API connectivity for both data sources
   * This now uses a cache to avoid triggering extra API calls
   */
  async checkApiConnectivity(): Promise<{zoho: boolean, stripe: boolean}> {
    // If we already have the status and it's recent, return it
    if (this.apiConnectivityStatus) {
      return this.apiConnectivityStatus;
    }
    
    // Otherwise get fresh status
    const cacheKey = `api-connectivity-check-${Date.now()}`;
    
    // Use the ApiRequestManager to execute the connectivity check
    const result = await apiRequestManager.executeRequest(
      cacheKey,
      async () => {
        console.log("FinancialService: Checking API connectivity");
        const zohoConnected = await zohoRepository.checkApiConnectivity();
        const stripeConnected = await stripeRepository.checkApiConnectivity();
        
        return { 
          zoho: zohoConnected, 
          stripe: stripeConnected 
        };
      },
      30000 // 30 second TTL for connectivity checks
    );
    
    // Cache the result
    this.apiConnectivityStatus = result;
    
    return result;
  }

  /**
   * Verify cache integrity for a range - simplified to just check for cache presence
   */
  async verifyCacheIntegrity(dateRange: { startDate: Date; endDate: Date }): Promise<void> {
    try {
      // Verify Zoho cache
      const zohoCache = await CacheService.checkCache(
        'Zoho', 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      if (zohoCache.cached && zohoCache.status === 'complete') {
        // Check cached transaction data without attempting repair
        const { isConsistent, transactionCount } = await CacheService.verifyCacheIntegrity(
          'Zoho',
          dateRange.startDate,
          dateRange.endDate
        );
        
        if (!isConsistent && transactionCount < 10) {
          console.log("Cache integrity issue detected but repair functionality has been removed.");
          // Cache repair has been removed as part of simplification
        }
      }
      
      // Verify Stripe cache (similar approach)
      const stripeCache = await CacheService.checkCache(
        'Stripe', 
        dateRange.startDate, 
        dateRange.endDate
      );
      
      if (stripeCache.cached && stripeCache.status === 'complete') {
        const { isConsistent, transactionCount } = await CacheService.verifyCacheIntegrity(
          'Stripe',
          dateRange.startDate,
          dateRange.endDate
        );
        
        if (!isConsistent && transactionCount < 5) {
          console.log("Stripe cache integrity issue detected. Will force refresh during next data fetch.");
        }
      }
    } catch (err) {
      console.error("Error verifying cache integrity:", err);
    }
  }

  /**
   * Save financial data to the database
   */
  async saveFinancialSummary(
    financialData: FinancialData, 
    dateRange: { startDate: Date; endDate: Date },
    cacheSegmentId?: string
  ): Promise<string | null> {
    try {
      // Check for valid date range
      if (!dateRange.startDate || !dateRange.endDate) {
        console.error("Cannot save financial summary: Invalid date range", dateRange);
        return null;
      }
      
      console.log("Attempting to save financial summary:", {
        summary: financialData.summary,
        dateRange
      });
      
      const summaryId = await financialSummaryService.saveFinancialSummary(
        financialData.summary,
        dateRange.startDate,
        dateRange.endDate,
        cacheSegmentId
      );
      
      if (summaryId) {
        console.log("Financial summary saved successfully with ID:", summaryId);
      } else {
        console.error("Failed to save financial summary");
      }
      
      return summaryId;
    } catch (err) {
      console.error("Error saving financial summary:", err);
      return null;
    }
  }

  /**
   * Fetch financial data from all sources
   */
  async fetchFinancialData(
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: FinancialDataCallbacks
  ): Promise<boolean> {
    // Generate a unique request ID for this fetch operation
    const requestId = `financial-data-${Date.now()}`;
    console.log(`FinancialService: Starting data fetch with ID ${requestId}`);
    
    // Generate a unique cache key for this fetch operation
    const fetchCacheKey = `financial-data-${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`;
    
    console.log(`FinancialService: Using cache key ${fetchCacheKey}, forceRefresh: ${forceRefresh}`);
    
    // Use ApiRequestManager to deduplicate multiple calls to fetchFinancialData
    return await apiRequestManager.executeRequest(
      fetchCacheKey,
      async () => {
        console.log(`FinancialService: Making actual fetch for ${fetchCacheKey}`);
        
        // If we've fetched recently and not forcing a refresh, don't fetch again
        const now = Date.now();
        if (!forceRefresh && now - this.lastFetchTimestamp < 2000) {
          console.log("Skipping fetch, too soon since last fetch");
          return false;
        }
        
        this.lastFetchTimestamp = now;
        console.log(`FinancialService: Fetching financial data (request ID: ${requestId})...`);
        
        try {
          // Check API connectivity first as part of the same operation
          const connectivity = await this.checkApiConnectivity();
          
          // Show connectivity toasts
          if (!connectivity.zoho && !connectivity.stripe) {
            toast({
              title: "API Connectivity Issue",
              description: "Cannot connect to Zoho or Stripe APIs. Using cached data if available.",
              variant: "destructive"
            });
          } else if (!connectivity.zoho) {
            toast({
              title: "Zoho API Connectivity Issue",
              description: "Cannot connect to Zoho API. Using cached data if available.",
              variant: "destructive"
            });
          } else if (!connectivity.stripe) {
            toast({
              title: "Stripe API Connectivity Issue",
              description: "Cannot connect to Stripe API. Using cached data if available.",
              variant: "destructive"
            });
          }
          
          // Get transactions from Zoho Books
          console.log(`FinancialService: Getting Zoho data (request ID: ${requestId})`);
          const zohoData = await zohoRepository.getTransactions(
            dateRange.startDate, 
            dateRange.endDate,
            forceRefresh
          );

          // Get the current raw response for debugging
          this.lastRawResponse = zohoRepository.getLastRawResponse();
          console.log(`FinancialService: Fetched raw response for debugging (request ID: ${requestId})`);

          // Process collaborator data - this is crucial for the fix
          callbacks.onCollaboratorData(this.lastRawResponse);

          // Get transactions from Stripe
          console.log(`FinancialService: Getting Stripe data (request ID: ${requestId})`);
          const stripeData = await stripeRepository.getTransactions(
            dateRange.startDate,
            dateRange.endDate,
            forceRefresh
          );

          // Combine the data
          const combinedData = [...zohoData, ...stripeData.transactions];
          console.log(`FinancialService: Combined ${zohoData.length} Zoho + ${stripeData.transactions.length} Stripe = ${combinedData.length} total transactions (request ID: ${requestId})`);
          
          console.log(`FinancialService: Stripe data summary (request ID: ${requestId}):`, {
            gross: stripeData.gross,
            fees: stripeData.fees,
            transactionFees: stripeData.transactionFees,
            payoutFees: stripeData.payoutFees,
            net: stripeData.net,
            feePercentage: stripeData.feePercentage
          });
          
          // Process separated income
          callbacks.onIncomeTypes(combinedData, stripeData);
          
          // Update transactions state
          callbacks.onTransactions(combinedData);
          
          console.log(`FinancialService: Fetch completed successfully (request ID: ${requestId})`);
          return true;
        } catch (err: any) {
          console.error(`FinancialService: Error fetching financial data (request ID: ${requestId}):`, err);
          
          // Make sure to get any raw response for debugging even in case of error
          const rawData = zohoRepository.getLastRawResponse();
          if (rawData) {
            this.lastRawResponse = rawData;
            console.log(`FinancialService: Set raw response after error (request ID: ${requestId}):`, rawData);
          }
          
          return false;
        }
      },
      forceRefresh ? 0 : 60000 // 1 minute TTL, or 0 if force refresh
    );
  }
}

// Export a singleton instance
export const financialService = new FinancialService();
