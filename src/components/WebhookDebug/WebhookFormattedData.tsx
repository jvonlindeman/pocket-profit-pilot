
import React from 'react';
import { isIncomeArray, isCollaboratorArray } from '@/utils/webhookDataUtils';

interface WebhookFormattedDataProps {
  rawData: any;
}

const WebhookFormattedData = ({ rawData }: WebhookFormattedDataProps) => {
  // Helper to summarize object value display
  const summarizeValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `Array con ${value.length} elementos`;
      } else {
        return `Objeto con ${Object.keys(value).length} propiedades`;
      }
    }
    
    return String(value);
  };
  
  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
        <p className="text-sm text-blue-800 font-medium">Resumen de la Estructura</p>
        <p className="text-xs text-blue-700 mt-1">
          {typeof rawData === 'object' && rawData !== null
            ? `Objeto con ${Object.keys(rawData).length} propiedades principales` 
            : 'Los datos no están en el formato esperado'}
        </p>
      </div>

      {typeof rawData === 'object' && rawData !== null ? (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left border-b">Propiedad</th>
              <th className="p-2 text-left border-b">Tipo</th>
              <th className="p-2 text-left border-b">Valor/Resumen</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rawData).map(([key, value]) => {
              const isIncome = key === 'payments';
              const isExpense = key === 'expenses';
              const isCollaborator = key === 'colaboradores';
              const isTransaction = key === 'cached_transactions';
              
              return (
                <tr key={key} className={`
                  ${isIncome ? 'bg-green-50' : ''}
                  ${isExpense ? 'bg-amber-50' : ''}
                  ${isCollaborator ? 'bg-blue-50' : ''}
                  ${isTransaction ? 'bg-purple-50' : ''}
                  hover:bg-opacity-80
                `}>
                  <td className="p-2 border-b font-medium">
                    {key}
                  </td>
                  <td className="p-2 border-b">
                    {Array.isArray(value) ? 
                      `Array[${value.length}]` : 
                      typeof value === 'object' && value !== null ? 
                        'Object' : 
                        typeof value
                    }
                  </td>
                  <td className="p-2 border-b">
                    {Array.isArray(value) ? (
                      <div>
                        {value.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {value.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-sm">
                                {typeof item === 'object' && item !== null ? (
                                  isIncome && 'customer_name' in item && 'amount' in item ? 
                                    `${item.customer_name || 'Cliente'}: ${item.amount}` :
                                  isExpense && 'vendor_name' in item && 'total' in item ?
                                    `${item.vendor_name || 'Sin proveedor'}: ${item.total}` :
                                  isCollaborator && 'vendor_name' in item && 'total' in item ?
                                    `${item.vendor_name || 'Colaborador'}: ${item.total}` :
                                    JSON.stringify(item).substring(0, 50) + (JSON.stringify(item).length > 50 ? '...' : '')
                                ) : String(item)}
                              </li>
                            ))}
                            {value.length > 3 && (
                              <li className="text-xs text-gray-500">
                                ...y {value.length - 3} más
                              </li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-gray-500">Array vacío</span>
                        )}
                      </div>
                    ) : typeof value === 'object' && value !== null ? (
                      <div>
                        <ul className="list-disc pl-5 space-y-1">
                          {Object.entries(value).slice(0, 3).map(([subKey, subValue]) => (
                            <li key={subKey} className="text-sm">
                              <span className="font-medium">{subKey}:</span> {summarizeValue(subValue)}
                            </li>
                          ))}
                          {Object.keys(value).length > 3 && (
                            <li className="text-xs text-gray-500">
                              ...y {Object.keys(value).length - 3} propiedades más
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      String(value)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No hay datos disponibles o el formato no es un objeto
        </div>
      )}
    </div>
  );
};

export default WebhookFormattedData;
