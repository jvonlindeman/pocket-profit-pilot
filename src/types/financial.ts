export interface Transaction {
  id: string;
  external_id?: string; // Added external_id as optional field
  date: string;
  amount: number;
  description: string;
  category: string;
  source: 'Zoho' | 'Stripe';
  type: 'income' | 'expense';
  fees?: number; // Added optional fees field
  gross?: number; // Added optional gross amount field (before fees)
  metadata?: any; // Added metadata field for additional properties
}

export interface UnpaidInvoice {
  customer_name: string;
  company_name?: string;
  balance: number;
}

export interface UpcomingSubscriptionPayment {
  subscription_id: string;
  customer: {
    id: string;
    email?: string | null;
    name?: string | null;
  } | null;
  plan_name: string;
  amount: number;
  gross_amount: number; // Added: Original subscription amount
  currency: string;
  next_payment_date: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_date: string;
  trial_end?: string | null;
  // Enhanced commission and fee breakdown
  stripe_processing_fee: number; // Calculated Stripe fee (4.43% real rate)
  business_commission_rate: number; // Configurable business commission rate
  business_commission_amount: number; // Calculated business commission
  discount_amount: number; // Any active discounts/coupons
  net_amount: number; // Final amount after all deductions
  discount_details?: {
    coupon_id?: string;
    coupon_name?: string;
    percent_off?: number;
    amount_off?: number;
  } | null;
}

export interface PendingActivationSubscription {
  subscription_id: string;
  customer: {
    id: string;
    email?: string | null;
    name?: string | null;
  } | null;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  created_date: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string | null;
  latest_invoice?: {
    id: string;
    amount_due: number;
    status: string;
    hosted_invoice_url?: string | null;
  } | null;
  cancel_at_period_end: boolean;
  days_until_due?: number | null;
}

export interface ReceivablesSelection {
  id: string;
  user_id: string;
  selection_type: 'zoho_invoices' | 'stripe_upcoming_payments' | 'stripe_pending_activations';
  item_id: string;
  selected: boolean;
  amount: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  collaboratorExpense: number;
  otherExpense: number;
  profit: number;
  profitMargin: number;
  grossProfit: number; // Added gross profit field 
  grossProfitMargin: number; // Added gross profit margin field
  startingBalance?: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  date?: string; // Fecha opcional para los colaboradores
  count?: number; // Added count property for number of transactions in category
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ChartData {
  labels: string[];
  values: number[];
}

export interface FinancialData {
  summary: FinancialSummary;
  transactions: Transaction[];
  incomeBySource: CategorySummary[];
  expenseByCategory: CategorySummary[];
  unpaidInvoices?: UnpaidInvoice[]; // Added unpaid invoices
  stripeUpcomingPayments?: UpcomingSubscriptionPayment[];
  stripePendingActivations?: PendingActivationSubscription[];
  dailyData: {
    income: ChartData;
    expense: ChartData;
  };
  monthlyData: {
    income: ChartData;
    expense: ChartData;
    profit: ChartData;
  };
}

export interface CollaboratorData {
  name: string;
  amount: number;
  percentage: number;
  date?: string; // Fecha opcional para los colaboradores
}

export interface MonthlyBalance {
  id: number;
  month_year: string;
  balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stripe_override: number | null; // Added to match the database schema
  opex_amount: number | null; // Added for OPEX percentage
  itbm_amount: number | null; // Added for ITBM amount
  profit_percentage: number | null; // Added for Profit First percentage
  tax_reserve_percentage: number | null; // Added for configurable tax reserve percentage
  include_zoho_fifty_percent: boolean | null; // Added for controlling 50% Zoho inclusion in salary
  business_commission_rate: number | null; // Added: Configurable business commission rate for receivables
}

// Short-term prediction types
export interface ShortTermPrediction {
  current_month: {
    confirmed_income: number;
    probable_income: number;
    estimated_expenses: number;
    predicted_profit: number;
    confidence: number;
  };
  next_month: {
    confirmed_income: number;
    probable_income: number;
    estimated_expenses: number;
    predicted_profit: number;
    confidence: number;
  };
  breakdown: {
    stripe_confirmed: number;
    stripe_probable: number;
    zoho_confirmed: number;
    collaborator_expenses: number;
    operational_expenses: number;
  };
  scenarios: {
    conservative: { profit: number; confidence: 95 };
    realistic: { profit: number; confidence: 80 };
    optimistic: { profit: number; confidence: 60 };
  };
}