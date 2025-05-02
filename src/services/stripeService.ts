
import { Transaction } from "../types/financial";

// Helper function to get the current year
const getCurrentYear = () => new Date().getFullYear();

// Mock data for Stripe with dates in current year
const stripeMockData: Transaction[] = [
  {
    id: "stripe-1",
    date: `${getCurrentYear()}-05-02`,
    amount: 1999.99,
    description: "Pago cliente Premium",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-2",
    date: `${getCurrentYear()}-05-08`,
    amount: 599.99,
    description: "Plan Básico - Cliente Nuevo",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-3",
    date: `${getCurrentYear()}-05-12`,
    amount: 29.99,
    description: "Comisión Stripe",
    category: "Comisiones de procesamiento",
    source: "Stripe",
    type: "expense"
  },
  {
    id: "stripe-4",
    date: `${getCurrentYear()}-05-15`,
    amount: 999.99,
    description: "Plan Estándar - Cliente Recurrente",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-5",
    date: `${getCurrentYear()}-05-22`,
    amount: 1299.99,
    description: "Servicio Personalizado",
    category: "Ingresos por servicios",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-6",
    date: `${getCurrentYear()}-05-25`,
    amount: 25.99,
    description: "Comisión Stripe",
    category: "Comisiones de procesamiento",
    source: "Stripe",
    type: "expense"
  }
];

export const StripeService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    // In a real implementation, this would call the Stripe API
    
    // Simulate a delay for API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.log("StripeService: Fetching transactions from", startDate, "to", endDate);

    // Filter the transactions by date
    const filteredTransactions = stripeMockData.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
    
    console.log("StripeService: Found transactions:", filteredTransactions.length);
    
    return filteredTransactions;
  },

  // In a real implementation, more methods would be added to interact with Stripe
};

export default StripeService;
