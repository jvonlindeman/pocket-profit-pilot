
import { Transaction } from "../../types/financial";
import { formatDateYYYYMMDD_Panama } from "../../utils/timezoneUtils";
import { ZohoTransactionResponse } from "./api/types";

// Mock data for development and testing purposes
export const getMockTransactions = (startDate: Date, endDate: Date): Transaction[] => {
  const formattedDate = formatDateYYYYMMDD_Panama(startDate);
  
  return [
    {
      id: `income-mock-${formattedDate}-1`,
      date: formattedDate,
      amount: 1500,
      description: 'Pago de Cliente A',
      category: 'Ingresos',
      source: 'Zoho',
      type: 'income'
    },
    {
      id: `income-mock-${formattedDate}-2`,
      date: formattedDate,
      amount: 2500,
      description: 'Pago de Cliente B',
      category: 'Ingresos',
      source: 'Zoho',
      type: 'income'
    },
    {
      id: `expense-mock-${formattedDate}-1`,
      date: formattedDate,
      amount: 500,
      description: 'Pago a colaborador: Juan Pérez',
      category: 'Pagos a colaboradores',
      source: 'Zoho',
      type: 'expense'
    },
    {
      id: `expense-mock-${formattedDate}-2`,
      date: formattedDate,
      amount: 250,
      description: 'Servicios en la nube',
      category: 'Servicios',
      source: 'Zoho',
      type: 'expense'
    }
  ];
};

// More comprehensive mock response that includes facturas_sin_pagar
export const getMockZohoWebhookResponse = async (startDate: Date, endDate: Date): Promise<ZohoTransactionResponse> => {
  const formattedDate = formatDateYYYYMMDD_Panama(startDate);
  
  return {
    colaboradores: [
      {
        vendor_name: "Juan Pérez",
        total: 500,
        date: formattedDate
      },
      {
        vendor_name: "María Gómez",
        total: 350,
        date: formattedDate
      }
    ],
    expenses: [
      {
        account_name: "Servicios",
        vendor_name: "AWS",
        total: 250,
        date: formattedDate
      },
      {
        account_name: "Gastos generales",
        vendor_name: "Papelería",
        total: 75,
        date: formattedDate
      }
    ],
    payments: [
      {
        customer_name: "Cliente A",
        amount: 1500,
        date: formattedDate,
        invoice_id: "INV-001"
      },
      {
        customer_name: "Cliente B",
        amount: 2500,
        date: formattedDate,
        invoice_id: "INV-002"
      }
    ],
    facturas_sin_pagar: [
      {
        balance: 1200,
        company_name: "Empresa XYZ",
        customer_name: "Cliente C"
      },
      {
        balance: 850,
        company_name: "Empresa ABC",
        customer_name: "Cliente D"
      },
      {
        balance: 1500,
        company_name: "Empresa UVW",
        customer_name: "Cliente E"
      }
    ],
    stripe: 3500
  };
};
