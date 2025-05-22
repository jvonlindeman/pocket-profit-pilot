
import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';

interface UnpaidInvoice {
  balance: number;
  company_name: string;
  customer_name: string;
}

interface InvoicesTabProps {
  invoices: UnpaidInvoice[];
}

export default function InvoicesTab({ invoices }: InvoicesTabProps) {
  // Handle empty or invalid data gracefully
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-amber-600 space-y-2 bg-amber-50 rounded-lg border border-amber-200">
        <AlertTriangle className="h-8 w-8" />
        <div className="text-center">
          <p className="font-medium">No hay datos de facturas sin pagar disponibles</p>
          <p className="text-sm text-amber-500 mt-1">Prueba a recargar los datos o verifica que el webhook esté configurado correctamente</p>
        </div>
      </div>
    );
  }

  // Filter out null or invalid entries
  const validInvoices = invoices.filter(inv => 
    inv && typeof inv.balance === 'number' && 
    (inv.customer_name || inv.company_name)
  );

  // Calculate total balance
  const totalBalance = validInvoices.reduce((sum, inv) => sum + (parseFloat(String(inv.balance)) || 0), 0);

  return (
    <div className="border rounded-md p-4 mt-2 bg-gray-50 max-h-[400px] overflow-auto">
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded">
        <p className="text-sm text-blue-800 font-medium">Facturas Sin Pagar ({validInvoices.length})</p>
        <p className="text-xs text-blue-700 mt-1 flex items-center">
          <FileText className="h-3 w-3 mr-1" />
          Total pendiente de cobro: ${totalBalance.toLocaleString()}
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
          {validInvoices.map((invoice, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-2 border-b font-medium">{invoice.customer_name || 'Sin nombre'}</td>
              <td className="p-2 border-b">{invoice.company_name || '-'}</td>
              <td className="p-2 border-b text-right font-medium text-amber-700">
                ${invoice.balance.toLocaleString()}
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
