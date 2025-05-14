import { Transaction } from "../../../types/financial";
import { parseToPanamaTime, formatDateYYYYMMDD_Panama } from "@/utils/timezoneUtils";
import { ZohoTransactionResponse } from "./types";
import { excludedVendors } from "./config";

// Helper function to process raw transaction data from the API into the Transaction type
export const processRawTransactions = (data: ZohoTransactionResponse): Transaction[] => {
  if (!data) {
    console.error("No data received from webhook");
    return [];
  }
  
  const result: Transaction[] = [];
  
  // If we received a raw_response instead of structured data, log it but return empty array
  if (data.raw_response && (!data.stripe && !data.colaboradores && !data.expenses && !data.payments)) {
    console.error("Received raw_response but no structured data:", data.raw_response);
    return [];
  }
  
  // Process Stripe income if available (new format)
  if (data.stripe) {
    try {
      // Parse the string to a number, handling comma as decimal separator
      const stripeAmount = parseFloat(String(data.stripe).replace(".", "").replace(",", "."));
      if (!isNaN(stripeAmount) && stripeAmount > 0) {
        const today = formatDateYYYYMMDD_Panama(new Date());
        result.push({
          id: `stripe-income-${today}-${stripeAmount}`,
          date: today,
          amount: stripeAmount,
          description: 'Ingresos de Stripe',
          category: 'Ingresos por plataforma',
          source: 'Stripe',
          type: 'income'
        });
      }
    } catch (e) {
      console.error("Error processing Stripe income:", e);
    }
  }
  
  // Process collaborator expenses with Panama timezone handling
  if (Array.isArray(data.colaboradores)) {
    data.colaboradores.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.vendor_name) {
        // Skip excluded vendors
        if (excludedVendors.includes(item.vendor_name)) {
          console.log(`Skipping excluded vendor: ${item.vendor_name}`);
          return; // Skip this collaborator
        }
        
        const amount = Number(item.total);
        if (amount > 0) {
          // Enhanced date handling for collaborator transactions
          let collaboratorDate: string;
          
          if (item.date) {
            // Log raw date field from API
            console.log(`Raw collaborator date for ${item.vendor_name}:`, item.date);
            
            // Ensure we have a valid YYYY-MM-DD format in Panama timezone
            try {
              // Try to parse and format the date in Panama timezone
              const parsedDate = parseToPanamaTime(item.date);
              collaboratorDate = formatDateYYYYMMDD_Panama(parsedDate);
              console.log(`Processed collaborator date for ${item.vendor_name} in Panama timezone:`, collaboratorDate);
            } catch (err) {
              console.error(`Error parsing collaborator date for ${item.vendor_name}:`, err);
              collaboratorDate = formatDateYYYYMMDD_Panama(new Date());
            }
          } else {
            console.log(`No date provided for collaborator ${item.vendor_name}, using current date in Panama timezone`);
            collaboratorDate = formatDateYYYYMMDD_Panama(new Date());
          }
          
          result.push({
            id: `colaborador-${item.vendor_name.replace(/\s/g, '-')}-${collaboratorDate}-${amount}`,
            date: collaboratorDate,
            amount,
            description: `Pago a colaborador: ${item.vendor_name}`,
            category: 'Pagos a colaboradores',
            source: 'Zoho',
            type: 'expense'
          });
        }
      }
    });
  }
  
  // Process regular expenses with Panama timezone handling
  if (Array.isArray(data.expenses)) {
    data.expenses.forEach((item: any, index: number) => {
      // Skip expenses with account_name "Impuestos"
      if (item && typeof item.total !== 'undefined' && item.account_name !== "Impuestos") {
        const amount = Number(item.total);
        if (amount > 0) {
          // Handle date in Panama timezone
          let expenseDate: string;
          try {
            if (item.date) {
              expenseDate = formatDateYYYYMMDD_Panama(parseToPanamaTime(item.date));
            } else {
              expenseDate = formatDateYYYYMMDD_Panama(new Date());
            }
          } catch (err) {
            console.error(`Error processing expense date:`, err);
            expenseDate = formatDateYYYYMMDD_Panama(new Date());
          }
          
          const vendorName = item.vendor_name || '';
          const accountName = item.account_name || 'Gastos generales';
          
          // Create a unique ID to avoid duplication issues
          const uniqueId = `zoho-expense-${expenseDate}-${vendorName ? vendorName.replace(/\s/g, '-') : 'unknown'}-${accountName.replace(/\s/g, '-')}-${expenseDate}-${amount}-${index}`;
          
          result.push({
            id: uniqueId,
            date: expenseDate,
            amount,
            description: vendorName 
              ? `Pago a ${vendorName}` 
              : `${accountName}`,
            category: accountName,
            source: 'Zoho',
            type: 'expense'
          });
        }
      }
    });
  }
  
  // Process payments (income) with Panama timezone handling
  if (Array.isArray(data.payments)) {
    data.payments.forEach((item: any, index: number) => {
      if (item && typeof item.amount !== 'undefined' && item.customer_name) {
        const amount = Number(item.amount);
        if (amount > 0) {
          // Process date in Panama timezone
          let paymentDate: string;
          try {
            if (item.date) {
              paymentDate = formatDateYYYYMMDD_Panama(parseToPanamaTime(item.date));
            } else {
              paymentDate = formatDateYYYYMMDD_Panama(new Date());
            }
          } catch (err) {
            console.error(`Error processing payment date:`, err);
            paymentDate = formatDateYYYYMMDD_Panama(new Date());
          }
          
          const customerName = item.customer_name;
          const invoiceId = item.invoice_id || '';
          
          // Create a unique ID to avoid duplication issues
          const uniqueId = `income-${customerName.replace(/\s/g, '-')}-${paymentDate}-${invoiceId || index}-${amount}`;
          
          result.push({
            id: uniqueId,
            date: paymentDate,
            amount,
            description: `Ingreso de ${customerName}`,
            category: 'Ingresos',
            source: 'Zoho',
            type: 'income'
          });
        }
      }
    });
  }
  
  // Sort by date (newer first)
  return result.sort((a, b) => parseToPanamaTime(b.date).getTime() - parseToPanamaTime(a.date).getTime());
};

// Filter transactions to exclude specific vendors
export const filterExcludedVendors = (transactions: Transaction[]): Transaction[] => {
  return transactions.filter(tx => {
    if (tx.type === 'expense' && tx.category === 'Pagos a colaboradores' && tx.description) {
      // Extract vendor name from description (format: "Pago a colaborador: Vendor Name")
      const vendorNameMatch = tx.description.match(/Pago a colaborador: (.*)/);
      if (vendorNameMatch && excludedVendors.includes(vendorNameMatch[1])) {
        return false;
      }
    }
    return true;
  });
};
