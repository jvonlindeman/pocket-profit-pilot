
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
        return {
          transactions: [],
          gross: 0,
          fees: 0,
          net: 0,
          feePercentage: 0
        };
      }
      
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
      return {
        transactions: [],
        gross: 0,
        fees: 0,
        net: 0,
        feePercentage: 0
      };
    }
  }
};

export default StripeService;
