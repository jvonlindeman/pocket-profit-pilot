
import React from 'react';

interface WebhookDataSummaryProps {
  rawData: any;
}

const WebhookDataSummary: React.FC<WebhookDataSummaryProps> = ({ rawData }) => {
  if (!rawData) return null;
  
  // Helper function to parse numeric values that might have different formats
  const parseNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle European number format (dots for thousands, comma as decimal separator)
      if (value.includes('.') && value.includes(',')) {
        const normalizedValue = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(normalizedValue);
        return isNaN(parsed) ? 0 : parsed;
      }
      
      // Simple comma as decimal separator
      if (value.includes(',') && !value.includes('.')) {
        const normalizedValue = value.replace(',', '.');
        const parsed = parseFloat(normalizedValue);
        return isNaN(parsed) ? 0 : parsed;
      }
      
      // Try direct parsing
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  
  // Calculate summary values with more robust checks
  const stripeIncome = rawData.stripe ? parseNumericValue(rawData.stripe) : 0;
  
  const collaboratorCount = rawData.colaboradores && Array.isArray(rawData.colaboradores) 
    ? rawData.colaboradores.length : 0;
    
  const collaboratorTotal = rawData.colaboradores && Array.isArray(rawData.colaboradores)
    ? rawData.colaboradores.reduce((sum: number, item: any) => {
        if (!item || typeof item.total === 'undefined') return sum;
        return sum + parseNumericValue(item.total);
      }, 0)
    : 0;
    
  const expenseCount = rawData.expenses && Array.isArray(rawData.expenses)
    ? rawData.expenses.length : 0;
    
  const expenseTotal = rawData.expenses && Array.isArray(rawData.expenses)
    ? rawData.expenses.reduce((sum: number, item: any) => {
        if (!item || typeof item.total === 'undefined') return sum;
        return sum + parseNumericValue(item.total);
      }, 0)
    : 0;
    
  const paymentCount = rawData.payments && Array.isArray(rawData.payments)
    ? rawData.payments.length : 0;
    
  const paymentTotal = rawData.payments && Array.isArray(rawData.payments)
    ? rawData.payments.reduce((sum: number, item: any) => {
        if (!item || typeof item.amount === 'undefined') return sum;
        return sum + parseNumericValue(item.amount);
      }, 0)
    : 0;

  // Check for transformed transactions (cached_transactions in the raw response)
  const transformedTransactionsCount = rawData.cached_transactions && Array.isArray(rawData.cached_transactions) 
    ? rawData.cached_transactions.length : 0;

  const transformedIncome = transformedTransactionsCount > 0
    ? rawData.cached_transactions
        .filter((tx: any) => tx.type === 'income')
        .reduce((sum: number, tx: any) => sum + parseNumericValue(tx.amount), 0)
    : 0;

  const transformedExpense = transformedTransactionsCount > 0
    ? rawData.cached_transactions
        .filter((tx: any) => tx.type === 'expense')
        .reduce((sum: number, tx: any) => sum + parseNumericValue(tx.amount), 0)
    : 0;
  
  // Calculate net income and other totals
  const totalIncome = stripeIncome + paymentTotal;
  const totalExpense = collaboratorTotal + expenseTotal;
  const netTotal = totalIncome - totalExpense;
  
  // Log the totals for debugging
  console.log("WebhookDataSummary calculated totals:", {
    stripeIncome,
    collaboratorTotal,
    expenseTotal,
    paymentTotal,
    totalIncome,
    totalExpense,
    netTotal,
    transformedTransactionsCount,
    transformedIncome,
    transformedExpense
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-4">
      <h3 className="text-sm font-semibold mb-2">Data Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-medium text-gray-500">Income</h4>
          <ul className="text-sm space-y-1 mt-1">
            <li className="flex justify-between">
              <span>Stripe:</span> 
              <span className="font-medium">{formatCurrency(stripeIncome)}</span>
            </li>
            <li className="flex justify-between">
              <span>Payments:</span>
              <span className="font-medium">{paymentCount} entries ({formatCurrency(paymentTotal)})</span>
            </li>
            <li className="flex justify-between text-blue-600 font-medium border-t border-gray-200 pt-1 mt-1">
              <span>Total Income:</span>
              <span>{formatCurrency(totalIncome)}</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-gray-500">Expenses</h4>
          <ul className="text-sm space-y-1 mt-1">
            <li className="flex justify-between">
              <span>Collaborators:</span>
              <span className="font-medium">{collaboratorCount} entries ({formatCurrency(collaboratorTotal)})</span>
            </li>
            <li className="flex justify-between">
              <span>Regular Expenses:</span>
              <span className="font-medium">{expenseCount} entries ({formatCurrency(expenseTotal)})</span>
            </li>
            <li className="flex justify-between text-red-600 font-medium border-t border-gray-200 pt-1 mt-1">
              <span>Total Expenses:</span>
              <span>{formatCurrency(totalExpense)}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">Net Income:</span>
          <span className={`text-sm font-bold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netTotal)}
          </span>
        </div>
      </div>
      
      {transformedTransactionsCount > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 mb-1">Transformed Transactions</h4>
          <div className="bg-green-50 p-2 rounded">
            <p className="text-sm font-medium">Found {transformedTransactionsCount} transformed transactions</p>
            <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
              <div>
                <span>Income: </span>
                <span className="font-medium">{formatCurrency(transformedIncome)}</span>
              </div>
              <div>
                <span>Expense: </span>
                <span className="font-medium">{formatCurrency(transformedExpense)}</span>
              </div>
            </div>
            <p className="text-xs mt-1">These transactions have been properly formatted but may not be displaying in the UI.</p>
          </div>
        </div>
      )}
      
      {(totalIncome > 0 || totalExpense > 0) && (
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
          <div className="bg-blue-50 p-2 rounded">
            <p className="font-medium">Debug Info:</p>
            <p>Raw data exists but may not be displaying in transactions. Check transformation in apiClient.ts.</p>
            <p>Data categories: {[
              rawData.stripe ? 'Stripe' : '',
              collaboratorCount > 0 ? 'Collaborators' : '',
              expenseCount > 0 ? 'Expenses' : '',
              paymentCount > 0 ? 'Payments' : ''
            ].filter(Boolean).join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookDataSummary;
