
import { FinancialData, DateRange, Transaction } from '@/types/financial';
import { formatDateYYYYMMDD } from '@/lib/date-utils';
import { supabase } from '@/integrations/supabase/client';
import { processTransactionData } from '@/services/zoho/utils';
import { getMockTransactions } from '@/services/zoho/mockData';

/**
 * Direct fetch service - Simplified service that directly fetches data from the webhook
 * without complex caching mechanisms
 */
export const DirectFetchService = {
  /**
   * Fetch financial data directly from the webhook
   */
  fetchFinancialData: async (
    startDate: Date,
    endDate: Date,
    startingBalance?: number
  ): Promise<{ financialData: FinancialData; rawResponse: any }> => {
    try {
      console.log('DirectFetchService: Fetching data from', startDate, 'to', endDate);
      
      // Format dates for the API
      const formattedStartDate = formatDateYYYYMMDD(startDate);
      const formattedEndDate = formatDateYYYYMMDD(endDate);
      
      // Call the Supabase edge function with our explicitly formatted dates
      const { data, error } = await supabase.functions.invoke("zoho-transactions", {
        body: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          startingBalance: startingBalance
        }
      });
      
      if (error) {
        console.error("Failed to fetch data from Supabase function:", error);
        // Fall back to mock data on error
        const mockTransactions = await getMockTransactions(startDate, endDate);
        const mockData = processTransactionData(mockTransactions, startingBalance);
        return { 
          financialData: mockData, 
          rawResponse: { error: error.message, message: "Using mock data due to error" } 
        };
      }
      
      if (!data) {
        console.log("No data returned from webhook, using mock data");
        const mockTransactions = await getMockTransactions(startDate, endDate);
        const mockData = processTransactionData(mockTransactions, startingBalance);
        return { 
          financialData: mockData, 
          rawResponse: { message: "No data returned from webhook, using mock data" } 
        };
      }
      
      // Parse and process the transactions
      let transactions: Transaction[] = [];
      
      if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
        transactions = data.cached_transactions.map((tx: any) => ({
          id: tx.id,
          date: tx.date,
          amount: Number(tx.amount),
          description: tx.description || '',
          category: tx.category,
          source: tx.source === 'Stripe' ? 'Stripe' : 'Zoho',
          type: tx.type === 'income' ? 'income' : 'expense'
        }));
      } else if (Array.isArray(data) && data.length > 0) {
        transactions = data;
      } else if (data.data && Array.isArray(data.data)) {
        transactions = data.data;
      }
      
      // Process the transactions to get the full financial data
      const financialData = processTransactionData(transactions, startingBalance);
      
      return { financialData, rawResponse: data };
    } catch (err) {
      console.error('Error fetching financial data:', err);
      // Fall back to mock data on error
      const mockTransactions = await getMockTransactions(startDate, endDate);
      const mockData = processTransactionData(mockTransactions, startingBalance);
      return { 
        financialData: mockData, 
        rawResponse: { 
          error: err instanceof Error ? err.message : 'Unknown error', 
          message: "Using mock data due to exception" 
        } 
      };
    }
  },
  
  /**
   * Extract stripe income from the raw response data
   */
  extractStripeIncome: (rawResponse: any): number => {
    try {
      // Try to extract Stripe income from the raw response
      if (rawResponse?.stripe) {
        // Handle various formats for the stripe value
        const stripeVal = rawResponse.stripe;
        if (typeof stripeVal === 'number') {
          return stripeVal;
        } else if (typeof stripeVal === 'string') {
          // Handle European number format (comma as decimal separator)
          return parseFloat(stripeVal.replace('.', '').replace(',', '.'));
        }
      }
      return 0;
    } catch (err) {
      console.error('Error extracting Stripe income:', err);
      return 0;
    }
  },
  
  /**
   * Extract collaborator expenses from the raw response data
   */
  extractCollaboratorExpenses: (rawResponse: any): any[] => {
    try {
      // Try to extract collaborator expenses from the raw response
      if (rawResponse?.colaboradores && Array.isArray(rawResponse.colaboradores)) {
        return rawResponse.colaboradores;
      }
      return [];
    } catch (err) {
      console.error('Error extracting collaborator expenses:', err);
      return [];
    }
  }
};
