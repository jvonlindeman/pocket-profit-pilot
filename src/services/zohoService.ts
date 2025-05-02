
// Este es un mock del servicio de Zoho Books
// En una implementación real, se conectaría con la API de Zoho Books

import { Transaction } from "../types/financial";

// Mock data for Zoho Books
const zohoMockData: Transaction[] = [
  {
    id: "zoho-1",
    date: "2023-05-01",
    amount: 2500,
    description: "Cliente ABC - Servicio de marketing",
    category: "Ingresos por servicio",
    source: "Zoho",
    type: "income"
  },
  {
    id: "zoho-2",
    date: "2023-05-05",
    amount: 1200,
    description: "Cliente XYZ - Consultoría",
    category: "Ingresos por consultoría",
    source: "Zoho",
    type: "income"
  },
  {
    id: "zoho-3",
    date: "2023-05-07",
    amount: 350,
    description: "Suscripción Adobe",
    category: "software",
    source: "Zoho",
    type: "expense"
  },
  {
    id: "zoho-4",
    date: "2023-05-10",
    amount: 780,
    description: "Pago a diseñador freelance",
    category: "personal",
    source: "Zoho",
    type: "expense"
  },
  {
    id: "zoho-5",
    date: "2023-05-15",
    amount: 1500,
    description: "Cliente DEF - Servicio mensual",
    category: "Ingresos recurrentes",
    source: "Zoho",
    type: "income"
  },
  {
    id: "zoho-6",
    date: "2023-05-18",
    amount: 250,
    description: "Suscripción herramientas de análisis",
    category: "tools",
    source: "Zoho",
    type: "expense"
  },
  {
    id: "zoho-7",
    date: "2023-05-20",
    amount: 2000,
    description: "Pago de salarios",
    category: "personal",
    source: "Zoho",
    type: "expense"
  }
];

export const ZohoService = {
  // Get transactions within a date range
  getTransactions: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    // En una implementación real, aquí se haría una llamada a la API de Zoho Books
    
    // Simulamos un delay para imitar una llamada a API
    await new Promise(resolve => setTimeout(resolve, 800));

    // Filtramos las transacciones por fecha
    return zohoMockData.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  },

  // En una implementación real, aquí se añadirían más métodos para interactuar con Zoho Books
  // como obtener facturas, contactos, etc.
};

export default ZohoService;
