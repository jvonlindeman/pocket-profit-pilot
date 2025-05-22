
import { Transaction } from "../../../types/financial";

export interface ZohoTransactionResponse {
  collaborators?: any[];
  colaboradores?: any[];
  expenses?: any[];
  payments?: any[];
  facturas_sin_pagar?: any[];
  stripe?: string | number;
  raw_response?: any;
  cached_transactions?: Transaction[];
  error?: string;
  webhook_url_configured?: boolean;
}

export interface ZohoWebhookOptions {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}

export interface WebhookCollaborator {
  date: string;
  total: number;
  status: string;
  vendor_name: string;
}

export interface WebhookExpense {
  date: string;
  total: number;
  vendor_name: string;
  account_name: string;
}

export interface WebhookPayment {
  date: string;
  amount: number;
  customer_name: string;
}

export interface WebhookUnpaidInvoice {
  balance: number;
  company_name: string;
  customer_name: string;
}
