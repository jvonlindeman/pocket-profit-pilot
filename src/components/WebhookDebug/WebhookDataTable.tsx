
import React from 'react';

interface WebhookDataTableProps {
  rawData: any;
}

const WebhookDataTable: React.FC<WebhookDataTableProps> = ({ rawData }) => {
  if (!rawData) return null;
  
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
              <td className="p-2 border-b font-medium" colSpan={3}>Gastos ({expenses.length})</td>
            </tr>
            {expenses.slice(0, 5).map((exp, index) => (
              <tr key={`exp-${index}`}>
                <td className="p-2 border-b pl-5">{index + 1}</td>
                <td className="p-2 border-b">{exp.account_name || "N/A"}</td>
                <td className="p-2 border-b">
                  {exp.vendor_name || "Sin proveedor"}: {exp.total} ({exp.date})
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
        
        {/* If no recognized data structure */}
        {!stripe && 
         !Array.isArray(colaboradores) && 
         !Array.isArray(expenses) && 
         !Array.isArray(payments) && (
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
