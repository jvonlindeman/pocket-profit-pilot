
// Este es un mock del servicio de Stripe
// En una implementación real, se conectaría con la API de Stripe

import { Transaction } from "../types/financial";

// Mock data for Stripe
const stripeMockData: Transaction[] = [
  {
    id: "stripe-1",
    date: "2023-05-02",
    amount: 1999.99,
    description: "Pago cliente Premium",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-2",
    date: "2023-05-08",
    amount: 599.99,
    description: "Plan Básico - Cliente Nuevo",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-3",
    date: "2023-05-12",
    amount: 29.99,
    description: "Comisión Stripe",
    category: "Comisiones de procesamiento",
    source: "Stripe",
    type: "expense"
  },
  {
    id: "stripe-4",
    date: "2023-05-15",
    amount: 999.99,
    description: "Plan Estándar - Cliente Recurrente",
    category: "Ingresos por suscripción",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-5",
    date: "2023-05-22",
    amount: 1299.99,
    description: "Servicio Personalizado",
    category: "Ingresos por servicios",
    source: "Stripe",
    type: "income"
  },
  {
    id: "stripe-6",
    date: "2023-05-25",
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
    // En una implementación real, aquí se haría una llamada a la API de Stripe
    
    // Simulamos un delay para imitar una llamada a API
    await new Promise(resolve => setTimeout(resolve, 600));

    // Filtramos las transacciones por fecha
    return stripeMockData.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  },

  // En una implementación real, aquí se añadirían más métodos para interactuar con Stripe
  // como obtener subscripciones, clientes, etc.
};

export default StripeService;
