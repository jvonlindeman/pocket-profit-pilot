
import { Transaction } from "../../types/financial";
import { UnpaidInvoice } from "./api/types";
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

// Mock data for unpaid invoices
export const getMockUnpaidInvoices = (): UnpaidInvoice[] => {
  return [
    {
      balance: 1066.79,
      company_name: "CLINICA DE ESPECIALIDADES ORTOPEDICAS SA",
      customer_name: "CLINICA DE ESPECIALIDADES ORTOPEDICAS SA"
    },
    {
      balance: 1712,
      company_name: "TRANSPORTES AMBIENTALES VERDES, S.A (Voltranc)",
      customer_name: "TRANSPORTES AMBIENTALES VERDES, S.A"
    },
    {
      balance: 856,
      company_name: "CREMACIONES LA GLORIA DIVINA, S.A.",
      customer_name: "CREMACIONES LA GLORIA DIVINA, S.A."
    },
    {
      balance: 642,
      company_name: "ARMANDO RAMZANY GARDELLINI CEDEÑO",
      customer_name: "ARMANDO RAMZANY GARDELLINI CEDEÑO"
    },
    {
      balance: 1155.53,
      company_name: "FIBROSCAN CORP, S.A.",
      customer_name: "FIBROSCAN CORP, S.A."
    },
    {
      balance: 107,
      company_name: "TECNOSERVICIOS HIDROMATICOS PTY S A",
      customer_name: "TECNOSERVICIOS HIDROMATICOS PTY S A"
    },
    {
      balance: 1262.6,
      company_name: "ARCOM INC",
      customer_name: "ARCOM INC"
    },
    {
      balance: 856,
      company_name: "ADMINISTRADORES EMPRESARIALES S A",
      customer_name: "ADMINISTRADORES EMPRESARIALES S A"
    },
    {
      balance: 856,
      company_name: "LAB CENTER S A",
      customer_name: "LAB CENTER S A"
    },
    {
      balance: 321,
      company_name: "Nova Respiración",
      customer_name: "Nova Respiración"
    },
    {
      balance: 214,
      company_name: "CENTRO DE IMAGENES DOCATI LOS ANDES, S.A.",
      customer_name: "CENTRO DE IMAGENES DOCATI LOS ANDES, S.A."
    },
    {
      balance: 856,
      company_name: "ARCE AVICOLA S A",
      customer_name: "ARCE AVICOLA S A"
    }
  ];
};

// Combined mock data for all Zoho webhook data
export const getMockZohoWebhookResponse = async (startDate: Date, endDate: Date) => {
  console.log("getMockZohoWebhookResponse: Generating mock webhook response data");
  
  return {
    colaboradores: [
      {
        vendor_name: "Maria Fernanda",
        date: `${getCurrentYear()}-05-14`,
        total: 400,
        status: "paid"
      },
      {
        vendor_name: "Jorge Martinez",
        date: `${getCurrentYear()}-05-01`,
        total: 500,
        status: "paid"
      }
    ],
    expenses: [
      {
        date: `${getCurrentYear()}-05-15`,
        total: 209.40,
        vendor_name: "SE Rankings",
        account_name: "SEO Tools"
      },
      {
        date: `${getCurrentYear()}-05-08`,
        total: 574.04,
        vendor_name: "Clickup",
        account_name: "Softwares Especiales"
      }
    ],
    payments: [
      {
        date: `${getCurrentYear()}-05-21`,
        amount: 479.9,
        customer_name: "CLINICA DENTAL OBARRIO"
      },
      {
        date: `${getCurrentYear()}-05-15`,
        amount: 321,
        customer_name: "ARMANDO RAMZANY GARDELLINI CEDEÑO"
      }
    ],
    facturas_sin_pagar: getMockUnpaidInvoices(),
    cached_transactions: await getMockTransactions(startDate, endDate)
  };
};
