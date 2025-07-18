
import { Transaction } from "../../../types/financial";

export interface ZohoTransactionResponse {
  collaborators?: any[];
  colaboradores?: any[];
  expenses?: any[];
  payments?: any[];
  stripe?: string | number;
  raw_response?: any;
  cached_transactions?: Transaction[];
}

export interface ZohoWebhookOptions {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}
