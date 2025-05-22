
import React from 'react';
import { FileText } from 'lucide-react';

interface UnpaidInvoice {
  balance: number;
  company_name: string;
  customer_name: string;
}

interface InvoicesTabProps {
  invoices: UnpaidInvoice[];
}

export default function InvoicesTab({ invoices }: InvoicesTabProps) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos de facturas sin pagar disponibles
      </div>
    );
  }

  // Calculate total balance
  const totalBalance = invoices.reduce((sum, inv) => sum + (parseFloat(String(inv.balance)) || 0), 0);

  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded">
        <p className="text-sm text-blue-800 font-medium">Facturas Sin Pagar</p>
        <p className="text-xs text-blue-700 mt-1 flex items-center">
          <FileText className="h-3 w-3 mr-1" />
          Facturas pendientes de cobro
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left border-b">Cliente</th>
            <th className="p-2 text-left border-b">Empresa</th>
            <th className="p-2 text-right border-b">Balance Pendiente</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-2 border-b font-medium">{invoice.customer_name || 'Sin nombre'}</td>
              <td className="p-2 border-b">{invoice.company_name || '-'}</td>
              <td className="p-2 border-b text-right font-medium text-amber-700">
                ${invoice.balance?.toLocaleString() || '0'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-amber-50">
          <tr>
            <td colSpan={2} className="p-2 border-t font-medium">Total Facturas Pendientes</td>
            <td className="p-2 border-t text-right font-medium text-amber-800">
              ${totalBalance.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
