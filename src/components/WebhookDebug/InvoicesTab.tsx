
import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

interface UnpaidInvoice {
  balance: number;
  company_name: string;
  customer_name: string;
}

interface InvoicesTabProps {
  invoices: UnpaidInvoice[];
}

export default function InvoicesTab({ invoices }: InvoicesTabProps) {
  console.log("InvoicesTab: Received invoices data:", invoices);
  
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

  console.log("InvoicesTab: Valid invoices count:", validInvoices.length);

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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-right">Balance Pendiente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validInvoices.map((invoice, index) => (
            <TableRow key={index} className="hover:bg-gray-50">
              <TableCell className="font-medium">{invoice.customer_name || 'Sin nombre'}</TableCell>
              <TableCell>{invoice.company_name || '-'}</TableCell>
              <TableCell className="text-right font-medium text-amber-700">
                ${invoice.balance.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-amber-50">
          <TableRow>
            <TableCell colSpan={2} className="font-medium">Total Facturas Pendientes</TableCell>
            <TableCell className="text-right font-medium text-amber-800">
              ${totalBalance.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
