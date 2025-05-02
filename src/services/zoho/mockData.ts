
import { Transaction } from "../../types/financial";
import { getCurrentYear } from "./utils";

// Mock data for fallback when API fails or for development
export const getMockTransactions = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
  // Original mock data with updated years
  const zohoMockData: Transaction[] = [
    {
      id: "zoho-1",
      date: `${getCurrentYear()}-05-01`,
      amount: 2500,
      description: "Cliente ABC - Servicio de marketing",
      category: "Ingresos por servicio",
      source: "Zoho",
      type: "income"
    },
    {
      id: "zoho-2",
      date: `${getCurrentYear()}-05-05`,
      amount: 1200,
      description: "Cliente XYZ - Consultoría",
      category: "Ingresos por consultoría",
      source: "Zoho",
      type: "income"
    },
    {
      id: "zoho-3",
      date: `${getCurrentYear()}-05-07`,
      amount: 350,
      description: "Suscripción Adobe",
      category: "software",
      source: "Zoho",
      type: "expense"
    },
    {
      id: "zoho-4",
      date: `${getCurrentYear()}-05-10`,
      amount: 780,
      description: "Pago a diseñador freelance",
      category: "personal",
      source: "Zoho",
      type: "expense"
    },
    {
      id: "zoho-5",
      date: `${getCurrentYear()}-05-15`,
      amount: 1500,
      description: "Cliente DEF - Servicio mensual",
      category: "Ingresos recurrentes",
      source: "Zoho",
      type: "income"
    },
    {
      id: "zoho-6",
      date: `${getCurrentYear()}-05-18`,
      amount: 250,
      description: "Suscripción herramientas de análisis",
      category: "tools",
      source: "Zoho",
      type: "expense"
    },
    {
      id: "zoho-7",
      date: `${getCurrentYear()}-05-20`,
      amount: 2000,
      description: "Pago de salarios",
      category: "personal",
      source: "Zoho",
      type: "expense"
    }
  ];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log("ZohoService mock: Filtering transactions from", startDate, "to", endDate);

  // Filter the transactions by date
  const filtered = zohoMockData.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });
  
  console.log("ZohoService mock: Found transactions:", filtered.length);
  
  return filtered;
};
