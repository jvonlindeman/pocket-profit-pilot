
import { Transaction } from "../../types/financial";

// The direct make.com webhook URL
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

/**
 * Helper function to parse numeric values that might come as strings with different formats
 * This is a crucial function as European number formats use comma as decimal separator
 */
const parseNumericValue = (value: any): number => {
  console.log(`Parsing numeric value: ${value} (type: ${typeof value})`);
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    // Special handling for European format numbers (e.g. "6.333,91")
    // First, detect if it's likely a European format (dots for thousands, comma for decimal)
    if (value.includes('.') && value.includes(',')) {
      // European format: replace dots (thousands) with nothing, then comma with dot
      const normalizedValue = value.replace(/\./g, '').replace(',', '.');
      console.log(`European format detected. Normalized to: ${normalizedValue}`);
      const parsed = parseFloat(normalizedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Simple comma as decimal separator
    if (value.includes(',') && !value.includes('.')) {
      const normalizedValue = value.replace(',', '.');
      console.log(`Comma decimal separator detected. Normalized to: ${normalizedValue}`);
      const parsed = parseFloat(normalizedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Standard number format
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
};

/**
 * Transforms webhook response data into Transaction objects
 */
const transformWebhookData = (responseData: any): Transaction[] => {
  console.log('Starting transformation of webhook data');
  console.log('Raw data structure:', Object.keys(responseData));
  
  const transactions: Transaction[] = [];
  
  // Process stripe income if present
  if (responseData.stripe) {
    console.log('Processing stripe income data:', responseData.stripe);
    const stripeAmount = parseNumericValue(responseData.stripe);
    console.log('Parsed stripe amount:', stripeAmount);
    if (stripeAmount > 0) {
      const stripeTransaction: Transaction = {
        id: `stripe-${new Date().toISOString().split('T')[0]}`,
        date: new Date().toISOString().split('T')[0],
        amount: stripeAmount,
        description: 'Ingresos de Stripe',
        category: 'Ingresos por plataforma',
        source: 'Stripe',
        type: 'income'
      };
      transactions.push(stripeTransaction);
      console.log('Added Stripe transaction:', stripeTransaction);
    }
  }
  
  // Process collaborator expenses if present
  if (responseData.colaboradores && Array.isArray(responseData.colaboradores)) {
    console.log(`Processing ${responseData.colaboradores.length} collaborator expenses`);
    responseData.colaboradores.forEach((collab: any, index: number) => {
      if (!collab) return; // Skip null/undefined items
      
      console.log(`Processing collaborator: ${JSON.stringify(collab)}`);
      const amount = parseNumericValue(collab.total);
      console.log(`Collaborator ${collab.vendor_name || 'unknown'}, amount: ${amount}`);
      
      if (amount > 0) {
        const collabTransaction: Transaction = {
          id: `colaborador-${index}-${collab.date || new Date().toISOString().split('T')[0]}`,
          date: collab.date || new Date().toISOString().split('T')[0],
          amount: amount,
          description: `Pago a colaborador: ${collab.vendor_name || 'Sin nombre'}`,
          category: 'Pagos a colaboradores',
          source: 'Zoho',
          type: 'expense'
        };
        transactions.push(collabTransaction);
        console.log('Added collaborator transaction:', collabTransaction.id, collabTransaction.amount);
      }
    });
  }
  
  // Process regular expenses if present
  if (responseData.expenses && Array.isArray(responseData.expenses)) {
    console.log(`Processing ${responseData.expenses.length} regular expenses`);
    responseData.expenses.forEach((expense: any, index: number) => {
      if (!expense) return; // Skip null/undefined items
      
      console.log(`Processing expense: ${JSON.stringify(expense)}`);
      const amount = parseNumericValue(expense.total);
      console.log(`Expense: ${expense.account_name || 'unknown'}, amount: ${amount}`);
      
      if (amount > 0) {
        const expenseTransaction: Transaction = {
          id: `expense-${index}-${expense.date || new Date().toISOString().split('T')[0]}`,
          date: expense.date || new Date().toISOString().split('T')[0],
          amount: amount,
          description: expense.vendor_name 
            ? `${expense.vendor_name}` 
            : expense.account_name || 'Gasto sin descripción',
          category: expense.account_name || 'Otros gastos',
          source: 'Zoho',
          type: 'expense'
        };
        transactions.push(expenseTransaction);
        console.log('Added expense transaction:', expenseTransaction.id, expenseTransaction.amount);
      }
    });
  }
  
  // Process regular income/payments if present
  if (responseData.payments && Array.isArray(responseData.payments)) {
    console.log(`Processing ${responseData.payments.length} regular income payments`);
    responseData.payments.forEach((payment: any, index: number) => {
      if (!payment) return; // Skip null/undefined items
      
      console.log(`Processing payment: ${JSON.stringify(payment)}`);
      const amount = parseNumericValue(payment.amount);
      console.log(`Payment from ${payment.customer_name || 'unknown'}, amount: ${amount}`);
      
      if (amount > 0) {
        const paymentTransaction: Transaction = {
          id: `payment-${index}-${payment.date || new Date().toISOString().split('T')[0]}`,
          date: payment.date || new Date().toISOString().split('T')[0],
          amount: amount,
          description: `Pago de ${payment.customer_name || 'Cliente'}`,
          category: 'Ingresos regulares',
          source: 'Zoho',
          type: 'income'
        };
        transactions.push(paymentTransaction);
        console.log('Added payment transaction:', paymentTransaction.id, paymentTransaction.amount);
      }
    });
  }
  
  console.log(`Transformed ${transactions.length} total transactions`);
  
  // Order transactions by date (newest first)
  const sortedTransactions = transactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return sortedTransactions;
};

export const fetchTransactionsFromWebhook = async (
  startDate: Date,
  endDate: Date,
  forceRefresh = false,
  returnRawResponse = false
) => {
  // Format dates carefully for consistency first, before using them
  const startDateFormatted = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const endDateFormatted = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`Fetching transactions from webhook for date range: ${startDateFormatted} to ${endDateFormatted}`);
  console.log(`Force refresh: ${forceRefresh}, Return raw response: ${returnRawResponse}`);
  
  try {
    // Now call the make.com webhook directly without using Supabase functions
    console.log(`Calling make.com webhook directly at: ${MAKE_WEBHOOK_URL}`);
    
    // Call the webhook with appropriate parameters
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        forceRefresh
      })
    });

    console.log(`Webhook response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from webhook:', errorText);
      throw new Error(`Error from webhook: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Raw response data structure:', JSON.stringify(responseData, null, 2).substring(0, 500) + '...');
    
    // Store raw response for debugging purposes
    if (returnRawResponse) {
      return responseData;
    }
    
    // First check if we have a cached_transactions array (already in the expected format)
    if (responseData.cached_transactions && Array.isArray(responseData.cached_transactions)) {
      console.log(`Got ${responseData.cached_transactions.length} cached transactions from webhook`);
      return responseData.cached_transactions;
    }
    
    // If it's already an array in the expected format
    if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].type !== undefined) {
      console.log(`Got ${responseData.length} transactions from direct array response`);
      return responseData;
    }
    
    // If it's a complex object with specific data structure, transform it
    if (typeof responseData === 'object' && 
        (responseData.stripe || responseData.colaboradores || 
         responseData.expenses || responseData.payments)) {
      console.log('Processing complex webhook response with multiple data types');
      const transformedTransactions = transformWebhookData(responseData);
      console.log(`Transformed ${transformedTransactions.length} transactions from webhook data`);
      return transformedTransactions;
    }
    
    // If we have a data property that contains the transactions
    if (responseData.data && Array.isArray(responseData.data)) {
      console.log(`Got ${responseData.data.length} transactions from data property`);
      return responseData.data;
    }
    
    console.warn('Could not parse transactions from response. Attempting direct transformation:', responseData);
    // Try direct transformation as a last resort
    const directTransformTransactions = transformWebhookData(responseData);
    if (directTransformTransactions.length > 0) {
      console.log(`Direct transformation yielded ${directTransformTransactions.length} transactions`);
      return directTransformTransactions;
    }
    
    console.warn('All parsing attempts failed. No transactions could be extracted from the response');
    return [];
  } catch (error) {
    console.error('Error fetching from webhook:', error);
    throw error;
  }
};
