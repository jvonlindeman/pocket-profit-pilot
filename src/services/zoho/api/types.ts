
import { Transaction } from "../../../types/financial";

export interface ZohoTransactionResponse {
  collaborators?: any[];
  colaboradores?: any[];
  expenses?: any[];
  payments?: any[];
  facturas_sin_pagar?: UnpaidInvoice[];
  stripe?: string | number;
  raw_response?: any;
  cached_transactions?: Transaction[];
}

export interface UnpaidInvoice {
  balance: number;
  company_name: string;
  customer_name: string;
}

export interface ZohoWebhookOptions {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}
