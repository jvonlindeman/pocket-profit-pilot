
import { useMemo } from 'react';
import { UnpaidInvoice } from '@/services/zoho/api/types';

export interface OverdueInvoicesSummary {
  totalAmount: number;
  count: number;
  invoices: UnpaidInvoice[];
}

export const useOverdueInvoices = (invoices?: UnpaidInvoice[]) => {
  const summary: OverdueInvoicesSummary = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        totalAmount: 0,
        count: 0,
        invoices: []
      };
    }

    // Calculate total amount
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
    
    // Return the summary object
    return {
      totalAmount,
      count: invoices.length,
      invoices: [...invoices].sort((a, b) => b.balance - a.balance) // Sort by highest amount first
    };
  }, [invoices]);

  // Function to get unique customers (some may appear multiple times)
  const getUniqueCustomerCount = (): number => {
    if (!invoices) return 0;
    const uniqueCustomers = new Set(invoices.map(invoice => invoice.customer_name));
    return uniqueCustomers.size;
  };

  return {
    summary,
    getUniqueCustomerCount,
  };
};
