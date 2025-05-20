import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";
import { formatDateYYYYMMDD_Panama, toPanamaTime, PANAMA_TIMEZONE } from "@/utils/timezoneUtils";
import CacheService from "./cache";

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
        console.log(`StripeService: Processing ${response.transactions.length} transactions for cache storage`);
        
        // Validate and prepare transaction data
        response.transactions.forEach((tx, index) => {
          if (!tx.id) {
            console.error(`StripeService: Transaction at index ${index} is missing id`, tx);
            tx.id = `stripe-missing-id-${Date.now()}-${index}`;
          }
          
          // Set external_id if missing
          if (!tx.external_id) {
            console.log(`StripeService: Setting external_id for transaction ${tx.id}`);
            tx.external_id = tx.id;
          }
          
          if (!tx.date) {
            console.error(`StripeService: Transaction ${tx.id} is missing date`, tx);
            tx.date = formatDateYYYYMMDD_Panama(new Date());
          } else {
            try {
              // Convert existing date to Panama timezone format
              tx.date = formatDateYYYYMMDD_Panama(toPanamaTime(new Date(tx.date)));
            } catch (e) {
              console.error(`Error converting transaction date to Panama timezone: ${tx.date}`, e);
              tx.date = formatDateYYYYMMDD_Panama(new Date());
            }
          }
          
          // Add metadata for fee types if not present
          if (tx.fees && !tx.metadata) {
            tx.metadata = { feeType: 'transaction' };
          }
          
          // Ensure required fields are present
          if (!tx.amount) {
            console.error(`StripeService: Transaction ${tx.id} is missing amount`, tx);
            tx.amount = 0;
          }
          
          if (!tx.type) {
            console.error(`StripeService: Transaction ${tx.id} is missing type`, tx);
            // Use type-safe assignment
            tx.type = 'income' as 'income' | 'expense';
          }
          
          if (!tx.source) {
            tx.source = 'Stripe' as 'Stripe';
          }
          
          // Log transaction validation status
          console.log(`StripeService: Validated transaction ${tx.id}: date=${tx.date}, amount=${tx.amount}, type=${tx.type}`);
        });
        
        // Store transactions in cache using the monthly approach
        if (response.transactions.length > 0) {
          console.log("StripeService: Storing", response.transactions.length, "transactions in monthly cache");
          
          // Group transactions by month for proper storage
          const groupedByMonth = new Map<string, Transaction[]>();
          
          response.transactions.forEach(tx => {
            if (!tx.date) return;
            
            const txDate = new Date(tx.date);
            const year = txDate.getFullYear();
            const month = txDate.getMonth() + 1; // JavaScript months are 0-indexed
            const key = `${year}-${month}`;
            
            if (!groupedByMonth.has(key)) {
              groupedByMonth.set(key, []);
            }
            
            groupedByMonth.get(key)!.push(tx);
          });
          
          // Store each month's transactions separately
          for (const [key, transactions] of groupedByMonth.entries()) {
            const [yearStr, monthStr] = key.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);
            
            console.log(`StripeService: Storing ${transactions.length} transactions for ${year}-${month}`);
            
            try {
              const success = await CacheService.storeMonthTransactions('Stripe', new Date(year, month - 1, 1), transactions);
              console.log(`StripeService: Cache storage for ${year}-${month} success:`, success);
              
              if (!success) {
                // Log a sample transaction for debugging
                if (transactions.length > 0) {
                  console.error("StripeService: Sample transaction that failed to cache:", JSON.stringify(transactions[0], null, 2));
                }
              }
            } catch (err) {
              console.error(`StripeService: Error storing transactions for ${year}-${month}:`, err);
            }
          }
          
          // Verify the transactions were stored correctly
          try {
            const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const endOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            
            const verificationCheck = await CacheService.checkCache('Stripe', startOfMonth, endOfMonth);
            console.log(`StripeService: Verification check - cached=${verificationCheck.cached}, count=${verificationCheck.data?.length || 0}`);
          } catch (err) {
            console.error("StripeService: Error verifying cache storage:", err);
          }
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
  },

  // Verify API connectivity
  checkApiConnectivity: async (): Promise<boolean> => {
    try {
      // Create a minimal date range to test connectivity
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Try to get raw response with minimal data
      const response = await supabase.functions.invoke('stripe-balance', {
        body: {
          startDate: formatDateYYYYMMDD_Panama(toPanamaTime(yesterday)),
          endDate: formatDateYYYYMMDD_Panama(toPanamaTime(today))
        }
      });
      
      // If we get any response, the API is connected
      return !response.error;
    } catch (error) {
      console.error("StripeService: API connectivity check failed:", error);
      return false;
    }
  },
  
  // Debug function to diagnose transaction caching issues
  debugCacheProcess: async (startDate: Date, endDate: Date): Promise<any> => {
    try {
      // Get transactions directly from API
      const panamaStartDate = toPanamaTime(startDate);
      const panamaEndDate = toPanamaTime(endDate);
      const formattedStartDate = formatDateYYYYMMDD_Panama(panamaStartDate);
      const formattedEndDate = formatDateYYYYMMDD_Panama(panamaEndDate);
      
      const { data, error } = await supabase.functions.invoke('stripe-balance', {
        body: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
      
      if (error) {
        return { 
          status: 'error', 
          message: 'Failed to fetch from API',
          error: error.message
        };
      }
      
      const response = data as StripeTransactionResponse;
      
      if (!response.transactions || !Array.isArray(response.transactions) || response.transactions.length === 0) {
        return {
          status: 'warning',
          message: 'No transactions returned from API',
          apiResponse: response
        };
      }
      
      // Check first 3 transactions for required fields
      const sampleTransactions = response.transactions.slice(0, 3);
      const transactionValidation = sampleTransactions.map(tx => ({
        id: tx.id || 'MISSING',
        external_id: tx.external_id || 'MISSING',
        amount: tx.amount !== undefined ? 'OK' : 'MISSING',
        date: tx.date || 'MISSING',
        type: tx.type || 'MISSING',
        source: tx.source || 'MISSING',
        metadata: tx.metadata ? 'OK' : 'MISSING'
      }));
      
      return {
        status: 'success',
        transactionCount: response.transactions.length,
        sampleValidation: transactionValidation,
        apiResponse: response
      };
    } catch (err) {
      return {
        status: 'error',
        message: 'Exception during debug',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
};

export default StripeService;
