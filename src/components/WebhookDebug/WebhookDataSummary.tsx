
import React from 'react';

interface WebhookDataSummaryProps {
  rawData: any;
}

const WebhookDataSummary = ({ rawData }: WebhookDataSummaryProps) => {
  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-green-50 border border-green-100 rounded">
          <h3 className="font-medium text-green-800">Transacciones de Ingreso</h3>
          <p className="text-sm mt-1">
            {Array.isArray(rawData?.payments) 
              ? `Encontradas ${rawData.payments.length} transacciones de ingreso` 
              : 'No se encontraron transacciones de ingreso'}
          </p>
          {Array.isArray(rawData?.payments) && rawData.payments.length > 0 && (
            <ul className="mt-2 text-xs space-y-1">
              {rawData.payments.slice(0, 3).map((item: any, i: number) => (
                <li key={i} className="text-green-700">
                  {item.customer_name || 'Cliente'}: {item.amount || 0}
                </li>
              ))}
              {rawData.payments.length > 3 && (
                <li className="text-green-600">...y {rawData.payments.length - 3} más</li>
              )}
            </ul>
          )}
        </div>
        
        <div className="p-3 bg-amber-50 border border-amber-100 rounded">
          <h3 className="font-medium text-amber-800">Transacciones de Gasto</h3>
          <p className="text-sm mt-1">
            {Array.isArray(rawData?.expenses) 
              ? `Encontradas ${rawData.expenses.length} transacciones de gasto` 
              : 'No se encontraron transacciones de gasto'}
          </p>
          {Array.isArray(rawData?.expenses) && rawData.expenses.length > 0 && (
            <ul className="mt-2 text-xs space-y-1">
              {rawData.expenses.slice(0, 3).map((item: any, i: number) => (
                <li key={i} className="text-amber-700">
                  {item.vendor_name || 'Sin proveedor'}: {item.total || 0}
                </li>
              ))}
              {rawData.expenses.length > 3 && (
                <li className="text-amber-600">...y {rawData.expenses.length - 3} más</li>
              )}
            </ul>
          )}
        </div>
        
        <div className="p-3 bg-blue-50 border border-blue-100 rounded">
          <h3 className="font-medium text-blue-800">Gastos de Colaboradores</h3>
          <p className="text-sm mt-1">
            {Array.isArray(rawData?.colaboradores) 
              ? `Encontrados ${rawData.colaboradores.length} gastos de colaboradores` 
              : 'No se encontraron gastos de colaboradores'}
          </p>
          {Array.isArray(rawData?.colaboradores) && rawData.colaboradores.length > 0 && (
            <ul className="mt-2 text-xs space-y-1">
              {rawData.colaboradores.slice(0, 3).map((item: any, i: number) => (
                <li key={i} className="text-blue-700">
                  {item.vendor_name || 'Sin nombre'}: {item.total || 0}
                </li>
              ))}
              {rawData.colaboradores.length > 3 && (
                <li className="text-blue-600">...y {rawData.colaboradores.length - 3} más</li>
              )}
            </ul>
          )}
        </div>
        
        <div className="p-3 bg-purple-50 border border-purple-100 rounded">
          <h3 className="font-medium text-purple-800">Transacciones Procesadas</h3>
          <p className="text-sm mt-1">
            {Array.isArray(rawData?.cached_transactions) 
              ? `Encontradas ${rawData.cached_transactions.length} transacciones procesadas` 
              : 'No se encontraron transacciones procesadas'}
          </p>
          {Array.isArray(rawData?.cached_transactions) && rawData.cached_transactions.length > 0 && (
            <div className="mt-2">
              <div className="text-xs mb-1 text-purple-700">Desglose por tipo:</div>
              <ul className="text-xs space-y-1">
                <li className="text-purple-700">
                  Ingresos: {rawData.cached_transactions.filter((tx: any) => tx.type === 'income').length}
                </li>
                <li className="text-purple-700">
                  Gastos: {rawData.cached_transactions.filter((tx: any) => tx.type === 'expense').length}
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
