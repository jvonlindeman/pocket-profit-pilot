
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
  
  // Log array details if available for debugging
  if (Array.isArray(data.colaboradores)) {
    console.log(`Processing ${data.colaboradores.length} collaborator records`);
  } else {
    console.log("No collaborator records found in data");
  }
  
  if (Array.isArray(data.expenses)) {
    console.log(`Processing ${data.expenses.length} expense records`);
  } else {
    console.log("No expense records found in data");
  }
  
  if (Array.isArray(data.payments)) {
    console.log(`Processing ${data.payments.length} payment records`);
  } else {
    console.log("No payment records found in data");
  }
  
  if (Array.isArray(data.cached_transactions)) {
    console.log(`Using ${data.cached_transactions.length} pre-processed cached transactions`);
    
    // If we have cached transactions, use them directly
    return data.cached_transactions.filter(tx => {
      // Basic data validation
      if (!tx || !tx.type || !tx.source) {
        console.log("Filtering invalid transaction:", tx);
        return false;
      }
      
      // Additional vendor filtering for expenses
      if (tx.type === 'expense' && tx.description) {
        let vendorName = '';
        
        if (tx.description.startsWith('Pago a ')) {
          vendorName = tx.description.substring(8); // Remove "Pago a " prefix
        } else if (tx.description.startsWith('Pago a colaborador: ')) {
          vendorName = tx.description.substring(20); // Remove "Pago a colaborador: " prefix
        }
        
        if (vendorName && excludedVendors.includes(vendorName)) {
          console.log(`Filtering excluded vendor transaction: ${vendorName}`);
          return false;
        }
      }
      
      return true;
    });
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
            console.log(`No date provided for collaborator ${item.vendor_name}, using current date`);
            collaboratorDate = formatDateYYYYMMDD_Panama(new Date());
          }
          
          const externalId = `colaborador-${item.vendor_name.replace(/\s/g, '-')}-${collaboratorDate}-${amount}`;
          
          result.push({
            id: externalId,
            external_id: externalId,
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
  
  // Process regular expenses (ignoring "Impuestos" category)
  if (Array.isArray(data.expenses)) {
    data.expenses.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.account_name !== "Impuestos") {
        // Skip expenses from excluded vendors
        if (item.vendor_name && excludedVendors.includes(item.vendor_name)) {
          console.log(`Skipping expense from excluded vendor: ${item.vendor_name}`);
          return;
        }

        const amount = Number(item.total);
        if (amount > 0) {
          const expenseDate = item.date || formatDateYYYYMMDD_Panama(new Date());
          const vendorName = item.vendor_name || '';
          const accountName = item.account_name || 'Gastos generales';
          
          const externalId = `expense-${(vendorName || accountName || '').replace(/\s/g, '-')}-${expenseDate}-${amount}-${index}`;
          
          result.push({
            id: externalId,
            external_id: externalId,
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
  
  // Process payments (income) - Extra logging and validation
  if (Array.isArray(data.payments)) {
    console.log(`Processing ${data.payments.length} payment/income records`);
    let validCount = 0;
    let invalidCount = 0;
    
    data.payments.forEach((item: any, index: number) => {
      // Detailed logging for payment data
      console.log(`Payment item ${index}:`, JSON.stringify(item));
      
      if (item) {
        // Validate the amount field with detailed logging
        if (typeof item.amount !== 'undefined') {
          console.log(`Payment ${index} has amount:`, item.amount, typeof item.amount);
          
          // Ensure it's a number by explicitly parsing
          let amount: number;
          if (typeof item.amount === 'string') {
            amount = parseFloat(item.amount.replace(/,/g, ''));
            console.log(`Parsed string amount to number:`, amount);
          } else {
            amount = Number(item.amount);
          }
          
          if (!isNaN(amount) && amount > 0) {
            const paymentDate = item.date || formatDateYYYYMMDD_Panama(new Date());
            const customerName = item.customer_name || 'Cliente';
            const invoiceId = item.invoice_id || '';
            
            console.log(`Creating income transaction for ${customerName}, amount: ${amount}, date: ${paymentDate}`);
            
            const externalId = `income-${customerName.replace(/\s/g, '-')}-${paymentDate}-${invoiceId || index}`;
            
            result.push({
              id: externalId,
              external_id: externalId,
              date: paymentDate,
              amount,
              description: `Ingreso de ${customerName}`,
              category: 'Ingresos',
              source: 'Zoho',
              type: 'income'
            });
            validCount++;
          } else {
            console.log(`Payment ${index} has invalid or non-positive amount:`, amount);
            invalidCount++;
          }
        } else {
          console.log(`Payment ${index} missing amount field`);
          invalidCount++;
        }
      } else {
        console.log(`Payment ${index} is null or undefined`);
        invalidCount++;
      }
    });
    
    console.log(`Payment processing completed: ${validCount} valid, ${invalidCount} invalid`);
  } else {
    console.log("No payments array found in data");
  }
  
  console.log(`Processed ${result.length} transactions from Zoho data:`, {
    incomes: result.filter(tx => tx.type === 'income').length,
    expenses: result.filter(tx => tx.type === 'expense').length
  });
  
  return result;
};

// Function to filter excluded vendors from any transaction array
export const filterExcludedVendors = (transactions: Transaction[]): Transaction[] => {
  if (!Array.isArray(transactions)) {
    console.warn("filterExcludedVendors received non-array input:", transactions);
    return [];
  }
  
  const filteredTransactions = transactions.filter(transaction => {
    // Extract vendor name from description if it exists
    let vendorName = '';
    
    if (transaction.description && transaction.description.startsWith('Pago a ')) {
      vendorName = transaction.description.substring(8); // Remove "Pago a " prefix
    } else if (transaction.description && transaction.description.startsWith('Pago a colaborador: ')) {
      vendorName = transaction.description.substring(20); // Remove "Pago a colaborador: " prefix
    }
    
    // Check if vendor is in excluded list
    if (vendorName && excludedVendors.includes(vendorName)) {
      console.log(`Filtering excluded vendor transaction: ${vendorName}`);
      return false;
    }
    
    return true;
  });
  
  console.log(`Filtered ${transactions.length - filteredTransactions.length} excluded vendor transactions`);
  return filteredTransactions;
};
