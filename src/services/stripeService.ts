
import { Transaction } from "../types/financial";

// No more mock data for Stripe - will connect to real API in the future
const StripeService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    // In a real implementation, this would call the Stripe API
    console.log("StripeService: Fetching transactions from", startDate, "to", endDate);
    
    // Return an empty array instead of mock data
    return [];
  }
};

export default StripeService;
