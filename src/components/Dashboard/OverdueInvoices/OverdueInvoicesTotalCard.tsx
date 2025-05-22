
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useOverdueInvoices } from '@/hooks/useOverdueInvoices';
import { UnpaidInvoice } from '@/services/zoho/api/types';

interface OverdueInvoicesTotalCardProps {
  className?: string;
  unpaidInvoices?: UnpaidInvoice[];
}

const OverdueInvoicesTotalCard: React.FC<OverdueInvoicesTotalCardProps> = ({ className, unpaidInvoices: propInvoices }) => {
  const { unpaidInvoices: contextInvoices, formatCurrency } = useFinance();
  const invoices = propInvoices || contextInvoices;
  const { summary, getUniqueCustomerCount } = useOverdueInvoices(invoices);

  // Debug log
  console.log("OverdueInvoicesTotalCard - Summary:", { 
    summary, 
    uniqueCustomers: getUniqueCustomerCount(),
    propInvoices: propInvoices?.length,
    contextInvoices: contextInvoices?.length
  });

  // No unpaid invoices case
  if (summary.count === 0) {
    return (
      <Card className={`bg-green-50 border-green-200 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Facturas por Cobrar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-green-700">No hay facturas pendientes</p>
            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-amber-50 border-amber-200 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-amber-800">Facturas por Cobrar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-semibold text-amber-900">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-xs text-amber-700 mt-1">
              {summary.count} facturas de {getUniqueCustomerCount()} clientes
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverdueInvoicesTotalCard;
