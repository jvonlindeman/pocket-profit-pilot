
import { Transaction } from "../types/financial";
import { supabase } from "@/integrations/supabase/client";

// Mock data for Stripe
const stripeMockData: Transaction[] = [
  {
    id: "stripe-1",
    date: "2023-05-02",
    amount: 1999.99,
    original_amount: 1999.99,
    currency: "USD",
    description: "Pago cliente Premium",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-2",
    date: "2023-05-08",
    amount: 599.99,
    original_amount: 599.99,
    currency: "USD",
    description: "Plan Básico - Cliente Nuevo",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-3",
    date: "2023-05-12",
    amount: 29.99,
    original_amount: 29.99,
    currency: "USD",
    description: "Comisión Stripe",
    category: "Comisiones de procesamiento",
    source: "Stripe",
    type: "expense"
  },
  {
    id: "stripe-4",
    date: "2023-05-15",
    amount: 999.99,
    original_amount: 999.99,
    currency: "USD",
    description: "Plan Estándar - Cliente Recurrente",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-5",
    date: "2023-05-22",
    amount: 1299.99,
    original_amount: 1299.99,
    currency: "USD",
    description: "Servicio Personalizado",
    category: "Ingresos por servicios",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-6",
    date: "2023-05-25",
    amount: 25.99,
    original_amount: 25.99,
    currency: "USD",
    description: "Comisión Stripe",
    category: "Comisiones de procesamiento",
    source: "Stripe",
    type: "expense"
  }
];

// Helper function to get exchange rates
const getExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase.functions.invoke('exchange-rates');
    
    if (error || !data || !data.rates) {
      console.error("Error fetching exchange rates:", error);
      return { EUR: 1.08, MXN: 0.05 }; // Fallback rates
    }
    
    return data.rates;
  } catch (err) {
    console.error("Exception fetching exchange rates:", err);
    return { EUR: 1.08, MXN: 0.05 }; // Fallback rates
  }
};

export const StripeService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    // In a real implementation, this would call the Stripe API
    
    // Simulate a delay for API call
    await new Promise(resolve => setTimeout(resolve, 600));

    // Filter the transactions by date
    const filteredTransactions = stripeMockData.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
    
    return filteredTransactions;
  },

  // In a real implementation, more methods would be added to interact with Stripe
};

export default StripeService;
