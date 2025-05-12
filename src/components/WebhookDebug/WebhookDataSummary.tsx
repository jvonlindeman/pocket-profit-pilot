
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
      const normalizedValue = value.replace(',', '.');
      const parsed = parseFloat(normalizedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  
  // Calculate summary values
  const stripeIncome = rawData.stripe ? parseNumericValue(rawData.stripe) : 0;
  
  const collaboratorCount = rawData.colaboradores && Array.isArray(rawData.colaboradores) 
    ? rawData.colaboradores.length : 0;
    
  const collaboratorTotal = rawData.colaboradores && Array.isArray(rawData.colaboradores)
    ? rawData.colaboradores.reduce((sum: number, item: any) => sum + parseNumericValue(item.total), 0)
    : 0;
    
  const expenseCount = rawData.expenses && Array.isArray(rawData.expenses)
    ? rawData.expenses.length : 0;
    
  const expenseTotal = rawData.expenses && Array.isArray(rawData.expenses)
    ? rawData.expenses.reduce((sum: number, item: any) => sum + parseNumericValue(item.total), 0)
    : 0;
    
  const paymentCount = rawData.payments && Array.isArray(rawData.payments)
    ? rawData.payments.length : 0;
    
  const paymentTotal = rawData.payments && Array.isArray(rawData.payments)
    ? rawData.payments.reduce((sum: number, item: any) => sum + parseNumericValue(item.amount), 0)
    : 0;
  
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
              <span>{formatCurrency(stripeIncome + paymentTotal)}</span>
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
              <span>{formatCurrency(collaboratorTotal + expenseTotal)}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">Net Income:</span>
          <span className={`text-sm font-bold ${(stripeIncome + paymentTotal - collaboratorTotal - expenseTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stripeIncome + paymentTotal - collaboratorTotal - expenseTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WebhookDataSummary;
