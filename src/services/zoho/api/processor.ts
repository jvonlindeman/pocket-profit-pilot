
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
  
  console.log("🔄 ZohoProcessor: Starting transaction processing", {
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
  
  // Process collaborator expenses with enhanced detection
  if (Array.isArray(data.colaboradores)) {
    console.log(`👥 ZohoProcessor: Processing ${data.colaboradores.length} collaborator entries`);
    
    data.colaboradores.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.vendor_name) {
        // Skip excluded vendors
        if (excludedVendors.includes(item.vendor_name)) {
          console.log(`🚫 ZohoProcessor: Skipping excluded collaborator vendor: ${item.vendor_name}`);
          return; // Skip this collaborator
        }
        
        const amount = Number(item.total);
        if (amount > 0) {
          // Enhanced date handling for collaborator transactions
          let collaboratorDate: string;
          
          if (item.date) {
            console.log(`📅 ZohoProcessor: Raw collaborator date for ${item.vendor_name}:`, item.date);
            
            try {
              const parsedDate = parseToPanamaTime(item.date);
              collaboratorDate = formatDateYYYYMMDD_Panama(parsedDate);
              console.log(`📅 ZohoProcessor: Processed collaborator date for ${item.vendor_name} in Panama timezone:`, collaboratorDate);
            } catch (err) {
              console.error(`❌ ZohoProcessor: Error parsing collaborator date for ${item.vendor_name}:`, err);
              collaboratorDate = formatDateYYYYMMDD_Panama(new Date());
            }
          } else {
            console.log(`📅 ZohoProcessor: No date provided for collaborator ${item.vendor_name}, using current date`);
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
          
          console.log(`✅ ZohoProcessor: Added collaborator transaction: ${item.vendor_name} - $${amount}`);
        }
      }
    });
  }
  
  // Process regular expenses with enhanced collaborator detection
  if (Array.isArray(data.expenses)) {
    console.log(`💰 ZohoProcessor: Processing ${data.expenses.length} expense entries`);
    
    data.expenses.forEach((item: any, index: number) => {
      if (item && typeof item.total !== 'undefined' && item.account_name !== "Impuestos") {
        // Skip expenses from excluded vendors
        if (item.vendor_name && excludedVendors.includes(item.vendor_name)) {
          console.log(`🚫 ZohoProcessor: Skipping expense from excluded vendor: ${item.vendor_name}`);
          return;
        }

        const amount = Number(item.total);
        if (amount > 0) {
          const expenseDate = item.date || formatDateYYYYMMDD_Panama(new Date());
          const vendorName = item.vendor_name || '';
          const accountName = item.account_name || 'Gastos generales';
          
          // Enhanced collaborator detection for regular expenses
          let category = accountName;
          let description = vendorName 
            ? `Pago a ${vendorName}` 
            : `${accountName}`;
          
          if (isCollaboratorTransaction(vendorName, accountName, item.description)) {
            category = 'Pagos a colaboradores';
            description = `Pago a colaborador: ${vendorName || accountName}`;
            console.log(`👥 ZohoProcessor: Detected collaborator expense: ${vendorName || accountName} - $${amount}`);
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
        }
      }
    });
  }
  
  // Process payments (income)
  if (Array.isArray(data.payments)) {
    console.log(`💵 ZohoProcessor: Processing ${data.payments.length} payment entries`);
    
    data.payments.forEach((item: any, index: number) => {
      if (item && typeof item.amount !== 'undefined') {
        const amount = Number(item.amount);
        if (amount > 0) {
          const paymentDate = item.date || formatDateYYYYMMDD_Panama(new Date());
          const customerName = item.customer_name || 'Cliente';
          const invoiceId = item.invoice_id || '';
          
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
          
          console.log(`💵 ZohoProcessor: Added payment transaction: ${customerName} - $${amount}`);
        }
      }
    });
  }
  
  console.log(`📊 ZohoProcessor: Processing complete. Generated ${result.length} transactions:`, {
    incomes: result.filter(tx => tx.type === 'income').length,
    expenses: result.filter(tx => tx.type === 'expense').length,
    collaboratorExpenses: result.filter(tx => tx.category === 'Pagos a colaboradores').length
  });
  
  return result;
};

// Process unpaid invoices from Zoho response
export const processUnpaidInvoices = (data: ZohoTransactionResponse): UnpaidInvoice[] => {
  if (!data || !data.facturas_sin_pagar) {
    return [];
  }
  
  try {
    const invoices: UnpaidInvoice[] = data.facturas_sin_pagar.map(invoice => ({
      customer_name: invoice.customer_name || 'Cliente sin nombre',
      company_name: invoice.company_name || '',
      balance: typeof invoice.balance === 'number' ? invoice.balance : parseFloat(invoice.balance)
    }));
    
    console.log(`Processed ${invoices.length} unpaid invoices from Zoho data`);
    return invoices;
  } catch (error) {
    console.error("Error processing unpaid invoices:", error);
    return [];
  }
};

// Calculate total amount of unpaid invoices
export const calculateTotalUnpaidAmount = (invoices: UnpaidInvoice[]): number => {
  return invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
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
