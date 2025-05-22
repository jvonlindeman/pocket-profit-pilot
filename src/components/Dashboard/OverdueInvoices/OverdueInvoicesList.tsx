
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { UnpaidInvoice } from '@/services/zoho/api/types';

interface OverdueInvoicesListProps {
  className?: string;
  limit?: number;
  unpaidInvoices?: UnpaidInvoice[];
}

const OverdueInvoicesList: React.FC<OverdueInvoicesListProps> = ({ 
  className, 
  limit = 5,
  unpaidInvoices: propInvoices
}) => {
  const { unpaidInvoices: contextInvoices, formatCurrency } = useFinance();
  const [showAll, setShowAll] = useState(false);
  
  // Use either prop invoices or context invoices
  const invoices = propInvoices || contextInvoices;
  
  // Debug log
  console.log("OverdueInvoicesList - Rendering with:", {
    propInvoices: propInvoices?.length,
    contextInvoices: contextInvoices?.length,
    usingInvoices: invoices?.length
  });

  if (!invoices || invoices.length === 0) {
    return null;
  }

  // Sort by highest balance first
  const sortedInvoices = [...invoices].sort((a, b) => b.balance - a.balance);
  
  // Determine which invoices to display based on the limit and showAll state
  const displayedInvoices = showAll ? sortedInvoices : sortedInvoices.slice(0, limit);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Cliente</TableHead>
              <TableHead className="w-1/4">Empresa</TableHead>
              <TableHead className="text-right w-1/4">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedInvoices.map((invoice, index) => (
              <TableRow key={`${invoice.customer_name}-${index}`}>
                <TableCell className="font-medium">{invoice.customer_name}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {invoice.company_name || '-'}
                </TableCell>
                <TableCell className="text-right font-semibold text-amber-700">
                  {formatCurrency(invoice.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {invoices.length > limit && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-gray-600 flex items-center gap-1"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Ver todas ({invoices.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OverdueInvoicesList;
