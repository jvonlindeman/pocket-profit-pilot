import { Transaction, FinancialData } from "../types/financial";
import { zohoRepository } from "../repositories/zohoRepository";
import { stripeRepository } from "../repositories/stripeRepository";
import CacheService from "../services/cache";
import { toast } from "@/hooks/use-toast";
import { financialSummaryService } from "./financialSummaryService";

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
