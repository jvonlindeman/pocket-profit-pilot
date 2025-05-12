
import { Transaction } from "../../types/financial";

// The direct make.com webhook URL
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/1iyetupimuaxn4au7gyf9kqnpihlmx22";

/**
 * Helper function to parse numeric values that might come as strings with different formats
 */
const parseNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle both dot and comma as decimal separators
    const normalizedValue = value.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Transforms webhook response data into Transaction objects
 */
const transformWebhookData = (responseData: any): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Process stripe income if present
  if (responseData.stripe) {
    console.log('Processing stripe income data:', responseData.stripe);
    const stripeAmount = parseNumericValue(responseData.stripe);
    console.log('Parsed stripe amount:', stripeAmount);
    if (stripeAmount > 0) {
      transactions.push({
        id: `stripe-${new Date().toISOString().split('T')[0]}`,
        date: new Date().toISOString().split('T')[0],
        amount: stripeAmount,
        description: 'Ingresos de Stripe',
        category: 'Ingresos por plataforma',
        source: 'Stripe',
        type: 'income'
      });
    }
  }
  
  // Process collaborator expenses if present
  if (responseData.colaboradores && Array.isArray(responseData.colaboradores)) {
    console.log(`Processing ${responseData.colaboradores.length} collaborator expenses`);
    responseData.colaboradores.forEach((collab: any, index: number) => {
      const amount = parseNumericValue(collab.total);
      console.log(`Collaborator ${collab.vendor_name}, amount: ${amount}`);
      if (amount > 0) {
        transactions.push({
          id: `colaborador-${index}-${collab.date || new Date().toISOString().split('T')[0]}`,
          date: collab.date || new Date().toISOString().split('T')[0],
          amount: amount,
          description: collab.vendor_name || 'Pago a colaborador',
          category: 'Pagos a colaboradores',
          source: 'Zoho',
          type: 'expense'
        });
      }
    });
  }
  
  // Process regular expenses if present
  if (responseData.expenses && Array.isArray(responseData.expenses)) {
    console.log(`Processing ${responseData.expenses.length} regular expenses`);
    responseData.expenses.forEach((expense: any, index: number) => {
      const amount = parseNumericValue(expense.total);
      console.log(`Expense: ${expense.account_name}, amount: ${amount}`);
      if (amount > 0) {
        transactions.push({
          id: `expense-${index}-${expense.date || new Date().toISOString().split('T')[0]}`,
          date: expense.date || new Date().toISOString().split('T')[0],
          amount: amount,
          description: expense.vendor_name || expense.account_name || 'Gasto',
          category: expense.account_name || 'Otros gastos',
          source: 'Zoho',
          type: 'expense'
        });
      }
    });
  }
  
  // Process regular income/payments if present
  if (responseData.payments && Array.isArray(responseData.payments)) {
    console.log(`Processing ${responseData.payments.length} regular income payments`);
    responseData.payments.forEach((payment: any, index: number) => {
      const amount = parseNumericValue(payment.amount);
      console.log(`Payment from ${payment.customer_name}, amount: ${amount}`);
      if (amount > 0) {
        transactions.push({
          id: `payment-${index}-${payment.date || new Date().toISOString().split('T')[0]}`,
          date: payment.date || new Date().toISOString().split('T')[0],
          amount: amount,
          description: payment.customer_name || 'Ingreso',
          category: 'Ingresos regulares',
          source: 'Zoho',
          type: 'income'
        });
      }
    });
  }
  
  console.log(`Transformed ${transactions.length} total transactions`);
  
  // Order transactions by date (newest first)
  return transactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
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
    
    console.warn('Could not parse transactions from response:', responseData);
    return [];
  } catch (error) {
    console.error('Error fetching from webhook:', error);
    throw error;
  }
};
