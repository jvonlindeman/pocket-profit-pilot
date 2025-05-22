
import { Transaction } from "../../../types/financial";

export interface ZohoTransactionResponse {
  collaborators?: any[];
  colaboradores?: any[];
  expenses?: any[];
  payments?: any[];
  stripe?: string | number;
  raw_response?: any;
  cached_transactions?: Transaction[];
  facturas_sin_pagar?: UnpaidInvoice[]; // Add this new field
}

export interface ZohoWebhookOptions {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}

// New interface for unpaid invoices
export interface UnpaidInvoice {
  balance: number;
  company_name: string;
  customer_name: string;
}
