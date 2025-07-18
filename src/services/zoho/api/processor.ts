
import { Transaction, UnpaidInvoice } from "../../../types/financial";
import { parseToPanamaTime, formatDateYYYYMMDD_Panama } from "@/utils/timezoneUtils";
import { ZohoTransactionResponse } from "./types";
import { excludedVendors } from "./config";

// Enhanced collaborator detection keywords
const COLLABORATOR_KEYWORDS = [
  'colaborador', 'colaboradores',
  'freelancer', 'freelancers', 
  'contractor', 'contractors',
  'consultant', 'consultants',
  'colaboracion', 'colaborativo',
  'external', 'externo', 'externos',
  'partner', 'socio', 'socios',
  'vendor', 'proveedor', 'proveedores',
  'independiente', 'autonomo',
  'servicios profesionales',
  'consultoria', 'asesoria'
];

// Enhanced function to detect collaborator transactions
const isCollaboratorTransaction = (vendorName: string, accountName: string, description?: string): boolean => {
  const searchText = `${vendorName} ${accountName} ${description || ''}`.toLowerCase();
  
  return COLLABORATOR_KEYWORDS.some(keyword => 
    searchText.includes(keyword)
  );
};

// Helper function to validate if a date is within the expected range
const isDateInRange = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  try {
    const transactionDate = new Date(dateStr + 'T00:00:00');
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return transactionDate >= start && transactionDate <= end;
  } catch (error) {
    console.error(`❌ ZohoProcessor: Error validating date range for ${dateStr}:`, error);
    return false;
  }
};

// Helper function to process date without timezone conversion for YYYY-MM-DD format
const processDateSafely = (dateInput: string, context: string = ''): string => {
  if (!dateInput) {
    console.log(`🔍 ZohoProcessor: No date provided for ${context}, using current date`);
    return formatDateYYYYMMDD_Panama(new Date());
  }
  
  // Enhanced logging for debugging
  console.log(`🔍 ZohoProcessor: Processing date for ${context}:`, {
    originalDate: dateInput,
    dateType: typeof dateInput,
    isYYYYMMDD: /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
  });
  
  // FIX: Check if date is already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    console.log(`✅ ZohoProcessor: Date already in YYYY-MM-DD format for ${context}: ${dateInput} (keeping as-is)`);
    return dateInput; // Keep the date as-is since it's already properly formatted
  } else {
    console.log(`🔄 ZohoProcessor: Converting timestamp date for ${context}: ${dateInput}`);
    try {
      const parsedDate = parseToPanamaTime(dateInput);
      const formattedDate = formatDateYYYYMMDD_Panama(parsedDate);
      console.log(`🔄 ZohoProcessor: Converted timestamp to Panama timezone for ${context}: ${dateInput} -> ${formattedDate}`);
      return formattedDate;
    } catch (err) {
      console.error(`❌ ZohoProcessor: Error parsing date for ${context}: ${dateInput}`, err);
      return formatDateYYYYMMDD_Panama(new Date());
    }
  }
};

// Helper function to process raw transaction data from the API into the Transaction type
export const processRawTransactions = (data: ZohoTransactionResponse): Transaction[] => {
  if (!data) {
    console.error("❌ ZohoProcessor: No data received from webhook");
    return [];
  }
  
  const result: Transaction[] = [];
  
  // If we received a raw_response instead of structured data, log it but return empty array
  if (data.raw_response && (!data.stripe && !data.colaboradores && !data.expenses && !data.payments)) {
    console.error("❌ ZohoProcessor: Received raw_response but no structured data:", data.raw_response);
    return [];
  }
  
  console.log("🔄 ZohoProcessor: Starting transaction processing with ENHANCED DATE DEBUGGING", {
    hasStripe: !!data.stripe,
    colaboradoresCount: data.colaboradores?.length || 0,
    expensesCount: data.expenses?.length || 0,
    paymentsCount: data.payments?.length || 0
  });
  
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
        console.log("💳 ZohoProcessor: Processed Stripe income:", stripeAmount);
      }
    } catch (e) {
      console.error("❌ ZohoProcessor: Error processing Stripe income:", e);
    }
  }
  
  // Process collaborator expenses with enhanced detection and date debugging
  if (Array.isArray(data.colaboradores)) {
    console.log(`👥 ZohoProcessor: Processing ${data.colaboradores.length} collaborator entries with ENHANCED DATE DEBUGGING`);
    
    data.colaboradores.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.vendor_name) {
        // Enhanced logging for collaborator dates
        console.log(`🔍 ZohoProcessor: COLLABORATOR [${index}] RAW DATA:`, {
          vendor_name: item.vendor_name,
          total: item.total,
          original_date: item.date,
          date_type: typeof item.date,
          all_item_keys: Object.keys(item)
        });
        
        // Skip excluded vendors
        if (excludedVendors.includes(item.vendor_name)) {
          console.log(`🚫 ZohoProcessor: Skipping excluded collaborator vendor: ${item.vendor_name}`);
          return; // Skip this collaborator
        }
        
        const amount = Number(item.total);
        if (amount > 0) {
          // Enhanced date handling for collaborator transactions with timezone fix
          const collaboratorDate = processDateSafely(item.date, `collaborator-${item.vendor_name}`);
          
          console.log(`🔍 ZohoProcessor: COLLABORATOR DATE PROCESSING RESULT:`, {
            vendor_name: item.vendor_name,
            original_date: item.date,
            processed_date: collaboratorDate,
            amount: amount
          });
          
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
          
          console.log(`✅ ZohoProcessor: Added collaborator transaction: ${item.vendor_name} - $${amount} on ${collaboratorDate}`);
        }
      }
    });
  }
  
  // Process regular expenses with enhanced collaborator detection and date debugging
  if (Array.isArray(data.expenses)) {
    console.log(`💰 ZohoProcessor: Processing ${data.expenses.length} expense entries with ENHANCED DATE DEBUGGING`);
    
    data.expenses.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.account_name !== "Impuestos") {
        // Enhanced logging for expense dates
        console.log(`🔍 ZohoProcessor: EXPENSE [${index}] RAW DATA:`, {
          vendor_name: item.vendor_name,
          account_name: item.account_name,
          total: item.total,
          original_date: item.date,
          date_type: typeof item.date,
          all_item_keys: Object.keys(item)
        });
        
        // Skip expenses from excluded vendors
        if (item.vendor_name && excludedVendors.includes(item.vendor_name)) {
          console.log(`🚫 ZohoProcessor: Skipping expense from excluded vendor: ${item.vendor_name}`);
          return;
        }

        const amount = Number(item.total);
        if (amount > 0) {
          // Enhanced date handling for regular expenses with timezone fix
          const expenseDate = processDateSafely(item.date, `expense-${item.vendor_name || item.account_name}`);
          const vendorName = item.vendor_name || '';
          const accountName = item.account_name || 'Gastos generales';
          
          console.log(`🔍 ZohoProcessor: EXPENSE DATE PROCESSING RESULT:`, {
            vendor_name: vendorName,
            account_name: accountName,
            original_date: item.date,
            processed_date: expenseDate,
            amount: amount
          });
          
          // Enhanced collaborator detection for regular expenses
          let category = accountName;
          let description = vendorName 
            ? `Pago a ${vendorName}` 
            : `${accountName}`;
          
          if (isCollaboratorTransaction(vendorName, accountName, item.description)) {
            category = 'Pagos a colaboradores';
            description = `Pago a colaborador: ${vendorName || accountName}`;
            console.log(`👥 ZohoProcessor: Detected collaborator expense: ${vendorName || accountName} - $${amount} on ${expenseDate}`);
          }
          
          const externalId = `expense-${(vendorName || accountName || '').replace(/\s/g, '-')}-${expenseDate}-${amount}-${index}`;
          
          result.push({
            id: externalId,
            external_id: externalId,
            date: expenseDate,
            amount,
            description,
            category,
            source: 'Zoho',
            type: 'expense'
          });
          
          console.log(`💰 ZohoProcessor: Added expense: ${vendorName || accountName} - $${amount} on ${expenseDate}`);
        }
      }
    });
  }
  
  // Process payments (income) with date debugging
  if (Array.isArray(data.payments)) {
    console.log(`💵 ZohoProcessor: Processing ${data.payments.length} payment entries with ENHANCED DATE DEBUGGING`);
    
    data.payments.forEach((item: any, index: number) => {
      if (item && typeof item.amount !== 'undefined') {
        // Enhanced logging for payment dates
        console.log(`🔍 ZohoProcessor: PAYMENT [${index}] RAW DATA:`, {
          customer_name: item.customer_name,
          amount: item.amount,
          original_date: item.date,
          date_type: typeof item.date,
          all_item_keys: Object.keys(item)
        });
        
        const amount = Number(item.amount);
        if (amount > 0) {
          // Enhanced date handling for payments with timezone fix
          const paymentDate = processDateSafely(item.date, `payment-${item.customer_name || 'unknown'}`);
          const customerName = item.customer_name || 'Cliente';
          const invoiceId = item.invoice_id || '';
          
          console.log(`🔍 ZohoProcessor: PAYMENT DATE PROCESSING RESULT:`, {
            customer_name: customerName,
            original_date: item.date,
            processed_date: paymentDate,
            amount: amount
          });
          
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
          
          console.log(`💵 ZohoProcessor: Added payment transaction: ${customerName} - $${amount} on ${paymentDate}`);
        }
      }
    });
  }
  
  console.log(`📊 ZohoProcessor: Processing complete. Generated ${result.length} transactions:`, {
    incomes: result.filter(tx => tx.type === 'income').length,
    expenses: result.filter(tx => tx.type === 'expense').length,
    collaboratorExpenses: result.filter(tx => tx.category === 'Pagos a colaboradores').length
  });
  
  // Final validation: log any suspicious dates
  result.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    const daysDiff = Math.abs((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 365) {
      console.warn(`⚠️ ZohoProcessor: Suspicious date detected - transaction more than 1 year old:`, {
        description: transaction.description,
        date: transaction.date,
        amount: transaction.amount,
        daysDifference: daysDiff
      });
    }
  });
  
  return result;
};

// RESTORED: Process unpaid invoices from Zoho response  
export const processUnpaidInvoices = (data: ZohoTransactionResponse): UnpaidInvoice[] => {
  console.log("🔄 ZohoProcessor: Processing unpaid invoices", {
    hasFacturasSinPagar: !!(data.facturas_sin_pagar),
    facturasSinPagarCount: Array.isArray(data.facturas_sin_pagar) ? data.facturas_sin_pagar.length : 0,
    dataKeys: Object.keys(data || {})
  });

  if (!data) {
    console.error("❌ ZohoProcessor: No data received for unpaid invoices");
    return [];
  }

  // Process facturas_sin_pagar from webhook
  if (Array.isArray(data.facturas_sin_pagar)) {
    console.log(`📋 ZohoProcessor: Processing ${data.facturas_sin_pagar.length} unpaid invoices`);
    
    const unpaidInvoices = data.facturas_sin_pagar
      .map((invoice: any, index: number) => {
        try {
          console.log(`📄 ZohoProcessor: Processing unpaid invoice [${index}]:`, {
            invoice_id: invoice.invoice_id,
            customer_name: invoice.customer_name,
            company_name: invoice.company_name,
            balance: invoice.balance,
            due_date: invoice.due_date,
            status: invoice.status
          });

          // Map the invoice data to our UnpaidInvoice type
          const unpaidInvoice: UnpaidInvoice = {
            invoice_id: invoice.invoice_id || `invoice-${index}`,
            customer_name: invoice.customer_name || 'Cliente desconocido',
            company_name: invoice.company_name || invoice.customer_name || 'Empresa desconocida',
            balance: Number(invoice.balance) || 0,
            due_date: invoice.due_date || null,
            status: invoice.status || 'unpaid',
            currency_code: invoice.currency_code || 'USD',
            invoice_number: invoice.invoice_number || invoice.invoice_id
          };

          console.log(`✅ ZohoProcessor: Mapped unpaid invoice: ${unpaidInvoice.customer_name} - $${unpaidInvoice.balance}`);
          return unpaidInvoice;
        } catch (error) {
          console.error(`❌ ZohoProcessor: Error processing unpaid invoice [${index}]:`, error, invoice);
          return null;
        }
      })
      .filter((invoice): invoice is UnpaidInvoice => invoice !== null);

    console.log(`📊 ZohoProcessor: Successfully processed ${unpaidInvoices.length} unpaid invoices:`, {
      totalBalance: unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0),
      sampleInvoices: unpaidInvoices.slice(0, 3).map(inv => ({
        customer: inv.customer_name,
        balance: inv.balance
      }))
    });

    return unpaidInvoices;
  }

  console.warn("⚠️ ZohoProcessor: No facturas_sin_pagar found in webhook data");
  return [];
};

export const calculateTotalUnpaidAmount = (invoices: UnpaidInvoice[]): number => {
  return invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
};

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
