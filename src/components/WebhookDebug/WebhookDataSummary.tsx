
import React from 'react';

interface WebhookDataSummaryProps {
  rawData: any;
}

export default function WebhookDataSummary({ rawData }: WebhookDataSummaryProps) {
  // Function to count the number of items in a specific category
  const countItems = (data: any, type: string) => {
    if (!data) return 0;
    
    // If the data is an array of cached transactions
    if (Array.isArray(data) && data.length > 0 && 'type' in data[0]) {
      return data.filter(item => item.type === type).length;
    }
    
    // If dealing with newly processed cached transactions
    if (data.cached_transactions && Array.isArray(data.cached_transactions)) {
      return data.cached_transactions.filter((item: any) => item.type === type).length;
    }
    
    // Using raw webhook data
    let count = 0;
    
    // Count stripe income
    if (type === 'income' && data.stripe) {
      count += 1; // Stripe income is counted as one item
    }
    
    // Count regular income (payments)
    if (type === 'income' && Array.isArray(data.payments)) {
      count += data.payments.length;
    }
    
    // Count expenses
    if (type === 'expense') {
      // Count collaborator expenses
      if (Array.isArray(data.colaboradores)) {
        count += data.colaboradores.length;
      }
      
      // Count regular expenses (excluding "Impuestos")
      if (Array.isArray(data.expenses)) {
        count += data.expenses.filter((exp: any) => exp.account_name !== "Impuestos").length;
      }
    }
    
    return count;
  };
  
  // Function to check if data is from cache
  const isFromCache = (data: any) => {
    // Check if the data is an array of cached transactions
    if (Array.isArray(data) && data.length > 0 && 'sync_date' in data[0]) {
      return true;
    }
    
    return false;
  };
  
  // Get cache information
  const getCacheInfo = (data: any) => {
    if (!isFromCache(data)) return null;
    
    // If the data is an array of cached transactions
    if (Array.isArray(data) && data.length > 0 && 'sync_date' in data[0]) {
      const latestSync = new Date(Math.max(...data.map(tx => new Date(tx.sync_date).getTime())));
      return {
        timestamp: latestSync,
        count: data.length
      };
    }
    
    return null;
  };
  
  const cacheInfo = getCacheInfo(rawData);
  const incomeCount = countItems(rawData, 'income');
  const expenseCount = countItems(rawData, 'expense');
  
  return (
    <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
      <p className="text-sm text-blue-800 font-medium">Resumen de Datos</p>
      
      {cacheInfo ? (
        <div className="mt-1 text-xs text-blue-700 bg-blue-100 p-1 rounded border border-blue-200 mb-2">
          <p className="font-semibold">Datos obtenidos de caché</p>
          <p>Última sincronización: {cacheInfo.timestamp.toLocaleString()}</p>
          <p>Total de transacciones cacheadas: {cacheInfo.count}</p>
        </div>
      ) : (
        <p className="mt-1 text-xs text-blue-700">Datos obtenidos directamente de la API</p>
      )}
      
      <div className="mt-1 text-xs text-blue-700">
        <p>Total Ingresos: {incomeCount}</p>
        <p>Total Gastos: {expenseCount}</p>
        <p>Total Transacciones: {incomeCount + expenseCount}</p>
      </div>
    </div>
  );
}
