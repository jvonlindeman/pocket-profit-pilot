
import React from 'react';

interface FormattedDataTabProps {
  rawData: any;
}

export default function FormattedDataTab({ rawData }: FormattedDataTabProps) {
  // Helper to determine if an item is an array of income
  const isIncomeArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'customer_name' in item[0] && 
           'amount' in item[0];
  };
  
  // Helper to check for collaborator data
  const isCollaboratorArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'vendor_name' in item[0] && 
           'total' in item[0];
  };

  // Helper to check for unpaid invoices data
  const isUnpaidInvoicesArray = (item: any): boolean => {
    return Array.isArray(item) && 
           item.length > 0 && 
           typeof item[0] === 'object' && 
           'balance' in item[0] && 
           'customer_name' in item[0];
  };

  if (!rawData) {
    return <div className="text-center py-8 text-gray-500">No hay datos disponibles</div>;
  }

  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
        <p className="text-sm text-blue-800 font-medium">Resumen de la Estructura</p>
        <p className="text-xs text-blue-700 mt-1">
          {Array.isArray(rawData) 
            ? `Array con ${rawData.length} elementos. Los elementos con vendor_name son gastos, el array al final contiene ingresos.` 
            : 'Los datos no están en el formato esperado (array)'}
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left border-b">Elemento #</th>
            <th className="p-2 text-left border-b">Tipo</th>
            <th className="p-2 text-left border-b">Datos</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(rawData) ? (
            rawData.map((item, index) => (
              <tr key={index} className={isIncomeArray(item) ? "bg-green-50" : ""}>
                <td className="p-2 border-b">{index + 1}</td>
                <td className="p-2 border-b font-medium">
                  {isIncomeArray(item) 
                    ? `Array de Ingresos (${Array.isArray(item) ? item.length : 0} elementos)` 
                    : isUnpaidInvoicesArray(item)
                      ? `Facturas sin pagar (${Array.isArray(item) ? item.length : 0} elementos)`
                      : item && typeof item === 'object' && 'vendor_name' in item 
                        ? `Gasto (${item.vendor_name || 'Sin proveedor'})` 
                        : Array.isArray(item) && item.length > 0 && item[0].vendor_name
                          ? `Array de Facturas (${item.length} elementos)`
                          : 'Desconocido'}
                </td>
                <td className="p-2 border-b">
                  {isIncomeArray(item) ? (
                    <div>
                      <p className="font-medium mb-1">Ejemplos de ingresos:</p>
                      <ul className="list-disc pl-5">
                        {Array.isArray(item) && item.slice(0, 3).map((income, idx) => (
                          <li key={idx} className="text-sm">
                            {income.customer_name}: {income.amount}
                          </li>
                        ))}
                        {Array.isArray(item) && item.length > 3 && (
                          <li className="text-xs text-gray-500">
                            ...y {item.length - 3} más
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : isUnpaidInvoicesArray(item) ? (
                    <div>
                      <p className="font-medium mb-1">Ejemplos de facturas sin pagar:</p>
                      <ul className="list-disc pl-5">
                        {Array.isArray(item) && item.slice(0, 3).map((invoice, idx) => (
                          <li key={idx} className="text-sm">
                            {invoice.customer_name}: ${invoice.balance}
                          </li>
                        ))}
                        {Array.isArray(item) && item.length > 3 && (
                          <li className="text-xs text-gray-500">
                            ...y {item.length - 3} más
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <div>
                      {item && typeof item === 'object' ? (
                        <ul className="list-disc pl-5">
                          {Object.entries(item).map(([key, value]) => (
                            <li key={key} className="text-sm">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </li>
                          ))}
                        </ul>
                      ) : Array.isArray(item) ? (
                        <div>
                          <p className="font-medium mb-1">Ejemplos de facturas:</p>
                          <ul className="list-disc pl-5">
                            {item.slice(0, 3).map((bill, idx) => (
                              <li key={idx} className="text-sm">
                                {bill.vendor_name ? `${bill.vendor_name}: ${bill.total}` : JSON.stringify(bill)}
                              </li>
                            ))}
                            {item.length > 3 && (
                              <li className="text-xs text-gray-500">
                                ...y {item.length - 3} más
                              </li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        String(item)
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : typeof rawData === 'object' ? (
            <tr>
              <td colSpan={3} className="p-2 border-b">
                <ul className="list-disc pl-5">
                  {Object.entries(rawData || {}).map(([key, value]) => (
                    <li key={key} className="text-sm">
                      <span className="font-medium">{key}:</span> {
                        typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value)
                      }
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={3} className="p-2 border-b">{String(rawData)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
