
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
    console.log("StripeService: [STORAGE_DEBUG] Starting transaction fetch", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      forceRefresh
    });
    
    try {
      // Check cache first if not forcing a refresh
      if (!forceRefresh) {
        console.log("StripeService: [STORAGE_DEBUG] Checking cache...");
        const cacheCheck = await CacheService.checkCache('Stripe', startDate, endDate);
        console.log("StripeService: [STORAGE_DEBUG] Cache check result:", {
          cached: cacheCheck.cached,
          dataLength: cacheCheck.data?.length || 0,
          hasData: !!cacheCheck.data
        });
        
        if (cacheCheck.cached && cacheCheck.data && cacheCheck.data.length > 0) {
          console.log("StripeService: [STORAGE_DEBUG] Using cached data, found", cacheCheck.data.length, "transactions");
          
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
        } else {
          console.log("StripeService: [STORAGE_DEBUG] Cache miss or no data, proceeding to API call");
        }
      }
      
      // Convert dates to Panama timezone before formatting
      const panamaStartDate = toPanamaTime(startDate);
      const panamaEndDate = toPanamaTime(endDate);
      
      // Format dates for API call using Panama timezone
      const formattedStartDate = formatDateYYYYMMDD_Panama(panamaStartDate);
      const formattedEndDate = formatDateYYYYMMDD_Panama(panamaEndDate);
      
      console.log("StripeService: [STORAGE_DEBUG] Calling Stripe edge function with Panama dates:", {
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
        console.error("StripeService: [STORAGE_DEBUG] Error fetching from API:", error);
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
      console.log("StripeService: [STORAGE_DEBUG] Stored raw response for debugging:", {
        hasData: !!data,
        transactionCount: data?.transactions?.length || 0,
        summaryExists: !!data?.summary
      });
      
      const response = data as StripeTransactionResponse;
      console.log("StripeService: [STORAGE_DEBUG] API response with summary:", response.summary);
      
      // Ensure all transaction dates are in Panama timezone format and validate data
      if (response.transactions && Array.isArray(response.transactions)) {
        console.log(`StripeService: [STORAGE_DEBUG] Processing ${response.transactions.length} transactions for cache storage`);
        
        // Validate and prepare transaction data
        const validTransactions: Transaction[] = [];
        
        response.transactions.forEach((tx, index) => {
          console.log(`StripeService: [STORAGE_DEBUG] Validating transaction ${index}:`, {
            id: tx.id,
            amount: tx.amount,
            date: tx.date,
            hasRequiredFields: !!(tx.id && tx.amount !== undefined && tx.date && tx.type && tx.source)
          });
          
          // Validate required fields
          if (!tx.id) {
            console.error(`StripeService: [STORAGE_DEBUG] Transaction at index ${index} is missing id`, tx);
            tx.id = `stripe-missing-id-${Date.now()}-${index}`;
          }
          
          // Set external_id if missing
          if (!tx.external_id) {
            console.log(`StripeService: [STORAGE_DEBUG] Setting external_id for transaction ${tx.id}`);
            tx.external_id = tx.id;
          }
          
          if (!tx.date) {
            console.error(`StripeService: [STORAGE_DEBUG] Transaction ${tx.id} is missing date`, tx);
            tx.date = formatDateYYYYMMDD_Panama(new Date());
          } else {
            try {
              // Convert existing date to Panama timezone format
              const originalDate = tx.date;
              tx.date = formatDateYYYYMMDD_Panama(toPanamaTime(new Date(tx.date)));
              console.log(`StripeService: [STORAGE_DEBUG] Converted date for ${tx.id}: ${originalDate} -> ${tx.date}`);
            } catch (e) {
              console.error(`StripeService: [STORAGE_DEBUG] Error converting transaction date to Panama timezone: ${tx.date}`, e);
              tx.date = formatDateYYYYMMDD_Panama(new Date());
            }
          }
          
          // Add metadata for fee types if not present
          if (tx.fees && !tx.metadata) {
            tx.metadata = { feeType: 'transaction' };
          }
          
          // Ensure required fields are present
          if (tx.amount === undefined || tx.amount === null) {
            console.error(`StripeService: [STORAGE_DEBUG] Transaction ${tx.id} is missing amount`, tx);
            tx.amount = 0;
          }
          
          if (!tx.type) {
            console.error(`StripeService: [STORAGE_DEBUG] Transaction ${tx.id} is missing type`, tx);
            tx.type = 'income' as 'income' | 'expense';
          }
          
          if (!tx.source) {
            tx.source = 'Stripe' as 'Stripe';
          }
          
          // Add year and month for proper indexing
          const txDate = new Date(tx.date);
          if (!isNaN(txDate.getTime())) {
            const year = txDate.getFullYear();
            const month = txDate.getMonth() + 1;
            (tx as any).year = year;
            (tx as any).month = month;
            console.log(`StripeService: [STORAGE_DEBUG] Added year/month to transaction ${tx.id}: ${year}/${month}`);
          }
          
          // Log final validation status
          const isValid = !!(tx.id && tx.amount !== undefined && tx.date && tx.type && tx.source);
          console.log(`StripeService: [STORAGE_DEBUG] Transaction ${tx.id} validation result:`, {
            isValid,
            id: !!tx.id,
            amount: tx.amount !== undefined,
            date: !!tx.date,
            type: !!tx.type,
            source: !!tx.source,
            year: (tx as any).year,
            month: (tx as any).month
          });
          
          if (isValid) {
            validTransactions.push(tx);
          } else {
            console.error(`StripeService: [STORAGE_DEBUG] Skipping invalid transaction:`, tx);
          }
        });
        
        console.log(`StripeService: [STORAGE_DEBUG] Validated ${validTransactions.length} out of ${response.transactions.length} transactions`);
        
        // Store transactions in cache using the NEW storeTransactions operation
        if (validTransactions.length > 0) {
          console.log("StripeService: [STORAGE_DEBUG] Attempting to store transactions in cache using new method");
          
          try {
            const storeResult = await CacheService.storeTransactions('Stripe', startDate, endDate, validTransactions);
            console.log("StripeService: [STORAGE_DEBUG] Store operation result:", storeResult);
            
            if (!storeResult) {
              console.error("StripeService: [STORAGE_DEBUG] Failed to store transactions in cache");
              // Log sample transaction for debugging
              if (validTransactions.length > 0) {
                console.error("StripeService: [STORAGE_DEBUG] Sample transaction that failed to cache:", JSON.stringify(validTransactions[0], null, 2));
              }
            } else {
              console.log("StripeService: [STORAGE_DEBUG] Successfully stored transactions in cache");
              
              // Verify the transactions were stored correctly
              try {
                const verificationCheck = await CacheService.checkCache('Stripe', startDate, endDate);
                console.log(`StripeService: [STORAGE_DEBUG] Verification check - cached=${verificationCheck.cached}, count=${verificationCheck.data?.length || 0}`);
                
                if (!verificationCheck.cached || !verificationCheck.data || verificationCheck.data.length === 0) {
                  console.error("StripeService: [STORAGE_DEBUG] CRITICAL: Transactions were not properly stored or retrieved from cache!");
                }
              } catch (verifyErr) {
                console.error("StripeService: [STORAGE_DEBUG] Error verifying cache storage:", verifyErr);
              }
            }
          } catch (storeErr) {
            console.error("StripeService: [STORAGE_DEBUG] Exception during cache storage:", storeErr);
          }
        } else {
          console.warn("StripeService: [STORAGE_DEBUG] No valid transactions to store");
        }
        
        // Update response with validated transactions
        response.transactions = validTransactions;
      } else {
        console.warn("StripeService: [STORAGE_DEBUG] No transactions in API response or invalid format");
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
      console.error("StripeService: [STORAGE_DEBUG] Critical error:", err);
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
