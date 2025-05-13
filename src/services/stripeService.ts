
import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";

interface StripeTransactionResponse {
  transactions: Transaction[];
  summary: {
    gross: number;
    fees: number;
    net: number;
    feePercentage: number;
  };
  status: string;
}

interface StripeData {
  transactions: Transaction[];
  gross: number;
  fees: number;
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
    stripeOverrideValue: number | null = null
  ): Promise<StripeData> => {
    console.log("StripeService: Fetching transactions from", startDate, "to", endDate);
    
    try {
      // If there's an override value, return that without calling the API
      if (stripeOverrideValue !== null) {
        console.log("StripeService: Using manual override value:", stripeOverrideValue);
        
        // Return manual override with a single transaction
        const overrideAmount = Number(stripeOverrideValue);
        
        // Create a transaction representing the manual override amount
        const transaction: Transaction = {
          id: `stripe-override-${startDate.toISOString().substring(0, 7)}`,
          date: startDate.toISOString().split('T')[0],
          amount: overrideAmount,
          description: 'Ingresos de Stripe (valor manual)',
          category: 'Ingresos por plataforma',
          source: 'Stripe',
          type: 'income'
        };
        
        // Create a simple response for override mode
        const overrideResponse = {
          transactions: [transaction],
          summary: {
            gross: overrideAmount,
            fees: 0,
            net: overrideAmount,
            feePercentage: 0,
          },
          status: 'override'
        };
        
        // Store the override response for debugging
        lastRawResponse = overrideResponse;
        
        return {
          transactions: [transaction],
          gross: overrideAmount,
          fees: 0, // We don't know the fees for manual override
          net: overrideAmount, // Net equals gross for manual override
          feePercentage: 0 // We don't know the fee percentage for manual override
        };
      }
      
      // Format dates for API call
      const formatDateYYYYMMDD = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      
      console.log("StripeService: Calling Stripe edge function with dates:", 
        formatDateYYYYMMDD(startDate), formatDateYYYYMMDD(endDate));
      
      // Call Stripe edge function to get real data
      const { data, error } = await supabase.functions.invoke('stripe-balance', {
        body: {
          startDate: formatDateYYYYMMDD(startDate),
          endDate: formatDateYYYYMMDD(endDate)
        }
      });
      
      if (error) {
        console.error("StripeService: Error fetching from API:", error);
        lastRawResponse = { error: error.message };
        return {
          transactions: [],
          gross: 0,
          fees: 0,
          net: 0,
          feePercentage: 0
        };
      }
      
      // Store the raw response for debugging
      lastRawResponse = data;
      console.log("StripeService: Stored raw response for debugging:", data);
      
      const response = data as StripeTransactionResponse;
      console.log("StripeService: API response with summary:", response.summary);
      
      return {
        transactions: response.transactions || [],
        gross: response.summary.gross || 0,
        fees: response.summary.fees || 0,
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
