
import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";
import { formatDateYYYYMMDD_Panama, toPanamaTime, PANAMA_TIMEZONE } from "@/utils/timezoneUtils";
import CacheService from "./cacheService";

interface StripeTransactionResponse {
  transactions: Transaction[];
  summary: {
    gross: number;
    fees: number;
    transactionFees: number;
    payoutFees: number;
    stripeFees: number;
    advances: number;
    advanceFunding: number;
    net: number;
    feePercentage: number;
    transactionCount: number;
    totalTransactionCount: number;
    transactionTypes: Record<string, number>;
  };
  status: string;
}

interface StripeData {
  transactions: Transaction[];
  gross: number;
  fees: number;
  transactionFees: number;
  payoutFees: number;
  stripeFees: number;
  advances: number;
  advanceFunding: number;
  net: number;
  feePercentage: number;
}

// Variable to store the last raw response from the Stripe API
let lastRawResponse: any = null;

const StripeService = {
  // Get transactions within a date range
  getTransactions: async (
    startDate: Date, 
    endDate: Date,
    forceRefresh: boolean = false
  ): Promise<StripeData> => {
    console.log("StripeService: Fetching transactions from", startDate, "to", endDate);
    
    try {
      // Check cache first if not forcing a refresh
      if (!forceRefresh) {
        const cacheCheck = await CacheService.checkCache('Stripe', startDate, endDate);
        
        if (cacheCheck.cached && cacheCheck.data && cacheCheck.data.length > 0) {
          console.log("StripeService: Using cached data, found", cacheCheck.data.length, "transactions");
          
          // We need to calculate the summary data for Stripe from cached transactions
          const transactions = cacheCheck.data;
          
          // Calculate summary data
          const gross = transactions.reduce((sum, tx) => sum + (tx.gross || tx.amount), 0);
          const fees = transactions.reduce((sum, tx) => sum + (tx.fees || 0), 0);
          const transactionFees = transactions
            .filter(tx => tx.metadata?.feeType === 'transaction')
            .reduce((sum, tx) => sum + (tx.fees || 0), 0);
          const payoutFees = transactions
            .filter(tx => tx.metadata?.feeType === 'payout')
            .reduce((sum, tx) => sum + (tx.fees || 0), 0);
          const stripeFees = transactions
            .filter(tx => tx.metadata?.feeType === 'stripe')
            .reduce((sum, tx) => sum + (tx.fees || 0), 0);
          const net = gross - fees;
          const feePercentage = gross > 0 ? (fees / gross) * 100 : 0;
          
          // Store the response for debugging
          lastRawResponse = {
            cached: true,
            transactions,
            summary: {
              gross,
              fees, 
              transactionFees,
              payoutFees,
              stripeFees,
              net,
              feePercentage
            },
            metrics: cacheCheck.metrics
          };
          
          return {
            transactions,
            gross,
            fees,
            transactionFees,
            payoutFees,
            stripeFees,
            advances: 0,
            advanceFunding: 0,
            net,
            feePercentage
          };
        }
      }
      
      // Convert dates to Panama timezone before formatting
      const panamaStartDate = toPanamaTime(startDate);
      const panamaEndDate = toPanamaTime(endDate);
      
      // Format dates for API call using Panama timezone
      const formattedStartDate = formatDateYYYYMMDD_Panama(panamaStartDate);
      const formattedEndDate = formatDateYYYYMMDD_Panama(panamaEndDate);
      
      console.log("StripeService: Calling Stripe edge function with Panama dates:", {
        formattedStartDate,
        formattedEndDate,
        timezone: PANAMA_TIMEZONE,
        panamaStartDate: panamaStartDate.toString(),
        panamaEndDate: panamaEndDate.toString()
      });
      
      // Call Stripe edge function to get real data
      const { data, error } = await supabase.functions.invoke('stripe-balance', {
        body: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
      
      if (error) {
        console.error("StripeService: Error fetching from API:", error);
        lastRawResponse = { error: error.message };
        return {
          transactions: [],
          gross: 0,
          fees: 0,
          transactionFees: 0,
          payoutFees: 0,
          stripeFees: 0,
          advances: 0,
          advanceFunding: 0,
          net: 0,
          feePercentage: 0
        };
      }
      
      // Store the raw response for debugging
      lastRawResponse = data;
      console.log("StripeService: Stored raw response for debugging:", data);
      
      const response = data as StripeTransactionResponse;
      console.log("StripeService: API response with summary:", response.summary);
      
      // Ensure all transaction dates are in Panama timezone format
      if (response.transactions && Array.isArray(response.transactions)) {
        response.transactions.forEach(tx => {
          if (tx.date) {
            try {
              // Convert existing date to Panama timezone format
              tx.date = formatDateYYYYMMDD_Panama(toPanamaTime(new Date(tx.date)));
            } catch (e) {
              console.error(`Error converting transaction date to Panama timezone: ${tx.date}`, e);
            }
          }
          
          // Add metadata for fee types if not present
          if (tx.fees && !tx.metadata) {
            tx.metadata = { feeType: 'transaction' };
          }
        });
        
        // Store transactions in cache
        if (response.transactions.length > 0) {
          console.log("StripeService: Storing", response.transactions.length, "transactions in cache");
          CacheService.storeTransactions('Stripe', startDate, endDate, response.transactions);
        }
      }
      
      return {
        transactions: response.transactions || [],
        gross: response.summary.gross || 0,
        fees: response.summary.fees || 0,
        transactionFees: response.summary.transactionFees || 0,
        payoutFees: response.summary.payoutFees || 0,
        stripeFees: response.summary.stripeFees || 0,
        advances: response.summary.advances || 0,
        advanceFunding: response.summary.advanceFunding || 0,
        net: response.summary.net || 0,
        feePercentage: response.summary.feePercentage || 0
      };
    } catch (err) {
      console.error("StripeService: Error:", err);
      lastRawResponse = { error: err instanceof Error ? err.message : "Unknown error" };
      return {
        transactions: [],
        gross: 0,
        fees: 0,
        transactionFees: 0,
        payoutFees: 0,
        stripeFees: 0,
        advances: 0,
        advanceFunding: 0,
        net: 0,
        feePercentage: 0
      };
    }
  },

  // Get the last raw response for debugging purposes
  getLastRawResponse: (): any => {
    return lastRawResponse;
  },
  
  // Set the raw response manually (useful for testing)
  setLastRawResponse: (data: any): void => {
    lastRawResponse = data;
  }
};

export default StripeService;
