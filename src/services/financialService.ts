import { Transaction, FinancialData } from "../types/financial";
import { zohoRepository } from "../repositories/zohoRepository";
import { stripeRepository } from "../repositories/stripeRepository";
import CacheService from "../services/cache";
import { toast } from "@/hooks/use-toast";

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
    // Calculate total collaborator expense from the collaboratorExpenses array
    const collaboratorExpense = collaboratorExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    const summary = {
      totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      collaboratorExpense: collaboratorExpense,
      otherExpense: 0,
      profit: 0,
      profitMargin: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
      startingBalance: startingBalance,
    };
    
    // Calculate other expenses (total expense minus collaborator expenses)
    summary.otherExpense = summary.totalExpense - summary.collaboratorExpense;
    
    summary.profit = summary.totalIncome - summary.totalExpense;
    summary.profitMargin = summary.totalIncome > 0 ? (summary.profit / summary.totalIncome) * 100 : 0;
    summary.grossProfit = summary.totalIncome;
    summary.grossProfitMargin = summary.totalIncome > 0 ? 100 : 0;
    
    return {
      summary,
      transactions,
      incomeBySource: [],
      expenseByCategory: [],
      dailyData: {
        income: { labels: [], values: [] },
        expense: { labels: [], values: [] }
      },
      monthlyData: {
        income: { labels: [], values: [] },
        expense: { labels: [], values: [] },
        profit: { labels: [], values: [] }
      }
    };
  }

  /**
   * Check API connectivity for both data sources
   */
  async checkApiConnectivity(): Promise<{zoho: boolean, stripe: boolean}> {
    const zohoConnected = await zohoRepository.checkApiConnectivity();
    const stripeConnected = await stripeRepository.checkApiConnectivity();
    
    return { 
      zoho: zohoConnected, 
      stripe: stripeConnected 
    };
  }

  /**
   * Verify cache integrity for a range
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
        // Verify there are actually transactions
        const { isConsistent, transactionCount } = await CacheService.verifyCacheIntegrity(
          'Zoho',
          dateRange.startDate,
          dateRange.endDate
        );
        
        if (!isConsistent && transactionCount < 10) {
          console.log("Cache integrity issue detected. Attempting repair...");
          
          // Try to repair the cache
          const repaired = await zohoRepository.repairCache(dateRange.startDate, dateRange.endDate);
          if (repaired) {
            console.log("Cache successfully repaired");
          } else {
            console.warn("Cache repair failed or wasn't needed");
          }
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
   * Fetch financial data from all sources
   */
  async fetchFinancialData(
    dateRange: { startDate: Date; endDate: Date },
    forceRefresh: boolean,
    callbacks: FinancialDataCallbacks
  ): Promise<boolean> {
    // If we've fetched recently and not forcing a refresh, don't fetch again
    const now = Date.now();
    if (!forceRefresh && now - this.lastFetchTimestamp < 2000) {
      console.log("Skipping fetch, too soon since last fetch");
      return false;
    }
    
    this.lastFetchTimestamp = now;
    console.log("Fetching financial data...");
    
    try {
      // Check API connectivity first
      const connectivity = await this.checkApiConnectivity();
      
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
      
      // Verify cache integrity
      await this.verifyCacheIntegrity(dateRange);
      
      // Get transactions from Zoho Books
      const zohoData = await zohoRepository.getTransactions(
        dateRange.startDate, 
        dateRange.endDate,
        forceRefresh
      );

      // Get the current raw response for debugging
      this.lastRawResponse = zohoRepository.getLastRawResponse();
      console.log("Fetched raw response for debugging:", this.lastRawResponse);

      // Process collaborator data - this is crucial for the fix
      callbacks.onCollaboratorData(this.lastRawResponse);

      // Get transactions from Stripe
      console.log("Fetching from Stripe:", dateRange.startDate, dateRange.endDate);
      const stripeData = await stripeRepository.getTransactions(
        dateRange.startDate,
        dateRange.endDate,
        forceRefresh
      );

      // Combine the data
      const combinedData = [...zohoData, ...stripeData.transactions];
      console.log("Combined transactions:", combinedData.length);
      console.log("Stripe data summary:", {
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
      
      // Schedule cache check for background refresh if needed
      if (!forceRefresh) {
        zohoRepository.checkAndRefreshCache(dateRange.startDate, dateRange.endDate);
      }
      
      return true;
    } catch (err: any) {
      console.error("Error fetching financial data:", err);
      
      // Make sure to get any raw response for debugging even in case of error
      const rawData = zohoRepository.getLastRawResponse();
      if (rawData) {
        this.lastRawResponse = rawData;
        console.log("Set raw response after error:", rawData);
      }
      
      return false;
    }
  }
}

// Export a singleton instance
export const financialService = new FinancialService();
