
import React from 'react';
import { extractWebhookSummary } from '@/utils/webhookDataUtils';

interface WebhookDataSummaryProps {
  rawData: any;
}

const WebhookDataSummary = ({ rawData }: WebhookDataSummaryProps) => {
  const summary = extractWebhookSummary(rawData);
  
  if (!summary) {
    return (
      <div className="border rounded-md p-4 mt-2 bg-gray-50 text-center py-8">
        No hay datos disponibles para resumir
      </div>
    );
  }
  
  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-green-50 border border-green-100 rounded">
          <h3 className="font-medium text-green-800">Transacciones de Ingreso</h3>
          <p className="text-sm mt-1">
            {summary.counts.incomes > 0
              ? `Encontradas ${summary.counts.incomes} transacciones de ingreso` 
              : 'No se encontraron transacciones de ingreso'}
          </p>
          {summary.incomeExamples.length > 0 && (
            <ul className="mt-2 text-xs space-y-1">
              {summary.incomeExamples.map((item: any, i: number) => (
                <li key={i} className="text-green-700">
                  {item.customer_name || 'Cliente'}: {item.amount || 0}
                </li>
              ))}
              {summary.counts.incomes > 3 && (
                <li className="text-green-600">...y {summary.counts.incomes - 3} más</li>
              )}
            </ul>
          )}
        </div>
        
        <div className="p-3 bg-amber-50 border border-amber-100 rounded">
          <h3 className="font-medium text-amber-800">Transacciones de Gasto</h3>
          <p className="text-sm mt-1">
            {summary.counts.expenses > 0
              ? `Encontradas ${summary.counts.expenses} transacciones de gasto` 
              : 'No se encontraron transacciones de gasto'}
          </p>
          {summary.expenseExamples.length > 0 && (
            <ul className="mt-2 text-xs space-y-1">
              {summary.expenseExamples.map((item: any, i: number) => (
                <li key={i} className="text-amber-700">
                  {item.vendor_name || 'Sin proveedor'}: {item.total || 0}
                </li>
              ))}
              {summary.counts.expenses > 3 && (
                <li className="text-amber-600">...y {summary.counts.expenses - 3} más</li>
              )}
            </ul>
          )}
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-100 rounded">
          <h3 className="font-medium text-blue-800">Gastos de Colaboradores</h3>
          <p className="text-sm mt-1">
            {summary.counts.collaborators > 0
              ? `Encontrados ${summary.counts.collaborators} gastos de colaboradores` 
              : 'No se encontraron gastos de colaboradores'}
          </p>
          {summary.collaboratorExamples.length > 0 && (
            <ul className="mt-2 text-xs space-y-1">
              {summary.collaboratorExamples.map((item: any, i: number) => (
                <li key={i} className="text-blue-700">
                  {item.vendor_name || 'Sin nombre'}: {item.total || 0}
                </li>
              ))}
              {summary.counts.collaborators > 3 && (
                <li className="text-blue-600">...y {summary.counts.collaborators - 3} más</li>
              )}
            </ul>
          )}
        </div>
        
        <div className="p-3 bg-purple-50 border border-purple-100 rounded">
          <h3 className="font-medium text-purple-800">Transacciones Procesadas</h3>
          <p className="text-sm mt-1">
            {summary.counts.cachedTransactions > 0
              ? `Encontradas ${summary.counts.cachedTransactions} transacciones procesadas` 
              : 'No se encontraron transacciones procesadas'}
          </p>
          {summary.counts.cachedTransactions > 0 && (
            <div className="mt-2">
              <div className="text-xs mb-1 text-purple-700">Desglose por tipo:</div>
              <ul className="text-xs space-y-1">
                <li className="text-purple-700">
                  Ingresos: {(rawData?.cached_transactions || []).filter((tx: any) => tx.type === 'income').length}
                </li>
                <li className="text-purple-700">
                  Gastos: {(rawData?.cached_transactions || []).filter((tx: any) => tx.type === 'expense').length}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebhookDataSummary;
