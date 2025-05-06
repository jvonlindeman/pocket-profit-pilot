
import React from 'react';

interface WebhookDataTableProps {
  rawData: any;
}

const WebhookDataTable: React.FC<WebhookDataTableProps> = ({ rawData }) => {
  if (!rawData) return null;
  
  // Handle raw string response or raw_response property
  if (typeof rawData === 'string' || (rawData.raw_response && typeof rawData.raw_response === 'string')) {
    return (
      <div className="bg-amber-50 p-3 rounded border border-amber-200 mb-4">
        <h3 className="font-medium text-amber-800 mb-2">Respuesta sin formato estructurado</h3>
        <p className="text-sm text-amber-700 mb-2">
          La respuesta del webhook es una cadena de texto y no un objeto JSON estructurado.
          Revisa la configuración de Make.com para asegurar que devuelve un objeto JSON válido.
        </p>
        <div className="bg-white/60 p-2 rounded border border-amber-100 max-h-[200px] overflow-auto">
          <pre className="text-xs break-words whitespace-pre-wrap">
            {typeof rawData === 'string' ? rawData : rawData.raw_response}
          </pre>
        </div>
      </div>
    );
  }
  
  // Extract the different sections of the data
  const { stripe, colaboradores, expenses, payments } = rawData;
  
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left border-b">Categoría</th>
          <th className="p-2 text-left border-b">Tipo</th>
          <th className="p-2 text-left border-b">Datos</th>
        </tr>
      </thead>
      <tbody>
        {/* Stripe row */}
        {stripe && (
          <tr>
            <td className="p-2 border-b font-medium">Stripe</td>
            <td className="p-2 border-b">Ingreso Total</td>
            <td className="p-2 border-b">{stripe}</td>
          </tr>
        )}
        
        {/* Colaboradores section */}
        {Array.isArray(colaboradores) && colaboradores.length > 0 && (
          <>
            <tr className="bg-amber-50">
              <td className="p-2 border-b font-medium" colSpan={3}>Colaboradores ({colaboradores.length})</td>
            </tr>
            {colaboradores.slice(0, 5).map((col, index) => (
              <tr key={`col-${index}`}>
                <td className="p-2 border-b pl-5">{index + 1}</td>
                <td className="p-2 border-b">{col.status || "N/A"}</td>
                <td className="p-2 border-b">
                  {col.vendor_name}: {col.total}
                </td>
              </tr>
            ))}
            {colaboradores.length > 5 && (
              <tr>
                <td className="p-2 border-b text-gray-500 text-xs" colSpan={3}>
                  ...y {colaboradores.length - 5} más
                </td>
              </tr>
            )}
          </>
        )}
        
        {/* Expenses section */}
        {Array.isArray(expenses) && expenses.length > 0 && (
          <>
            <tr className="bg-red-50">
              <td className="p-2 border-b font-medium" colSpan={3}>
                Gastos ({expenses.length})
                <span className="text-xs ml-2 font-normal text-gray-500">
                  (Impuestos excluidos de los cálculos)
                </span>
              </td>
            </tr>
            {expenses.slice(0, 5).map((exp, index) => (
              <tr key={`exp-${index}`} className={exp.account_name === "Impuestos" ? "bg-gray-50" : ""}>
                <td className="p-2 border-b pl-5">{index + 1}</td>
                <td className="p-2 border-b">{exp.account_name || "N/A"}</td>
                <td className="p-2 border-b">
                  {exp.vendor_name || "Sin proveedor"}: {exp.total} ({exp.date})
                  {exp.account_name === "Impuestos" && (
                    <span className="ml-2 text-xs text-gray-500 italic">
                      (Excluido de cálculos)
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {expenses.length > 5 && (
              <tr>
                <td className="p-2 border-b text-gray-500 text-xs" colSpan={3}>
                  ...y {expenses.length - 5} más
                </td>
              </tr>
            )}
          </>
        )}
        
        {/* Payments section */}
        {Array.isArray(payments) && payments.length > 0 && (
          <>
            <tr className="bg-green-50">
              <td className="p-2 border-b font-medium" colSpan={3}>Ingresos ({payments.length})</td>
            </tr>
            {payments.slice(0, 5).map((payment, index) => (
              <tr key={`payment-${index}`}>
                <td className="p-2 border-b pl-5">{index + 1}</td>
                <td className="p-2 border-b">{payment.date || "N/A"}</td>
                <td className="p-2 border-b">
                  {payment.customer_name}: {payment.amount}
                </td>
              </tr>
            ))}
            {payments.length > 5 && (
              <tr>
                <td className="p-2 border-b text-gray-500 text-xs" colSpan={3}>
                  ...y {payments.length - 5} más
                </td>
              </tr>
            )}
          </>
        )}
        
        {/* Error message section */}
        {rawData.error && (
          <tr className="bg-red-50">
            <td className="p-2 border-b font-medium" colSpan={3}>Error</td>
            <tr>
              <td className="p-2 border-b pl-5" colSpan={3}>{rawData.error}</td>
            </tr>
            {rawData.details && (
              <tr>
                <td className="p-2 border-b pl-5 text-sm text-gray-600" colSpan={3}>
                  Detalles: {rawData.details}
                </td>
              </tr>
            )}
          </tr>
        )}
        
        {/* If no recognized data structure */}
        {!stripe && 
         !Array.isArray(colaboradores) && 
         !Array.isArray(expenses) && 
         !Array.isArray(payments) && 
         !rawData.error && (
          <tr>
            <td colSpan={3} className="p-2 border-b text-amber-700">
              La estructura de datos no sigue el formato esperado. Consulta la pestaña de JSON Crudo.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default WebhookDataTable;
