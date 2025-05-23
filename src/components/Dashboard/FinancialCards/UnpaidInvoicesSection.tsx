
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinance } from '@/contexts/FinanceContext';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { UnpaidInvoice } from '@/types/financial';

type SortOrder = 'asc' | 'desc';
type SortField = 'customer_name' | 'company_name' | 'balance';

const UnpaidInvoicesSection: React.FC = () => {
  const { unpaidInvoices, formatCurrency } = useFinance();
  const [sortField, setSortField] = useState<SortField>('balance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Calculate total unpaid amount
  const totalUnpaid = useMemo(() => 
    unpaidInvoices.reduce((sum, invoice) => sum + invoice.balance, 0),
    [unpaidInvoices]
  );

  // Sort invoices based on current sort field and order
  const sortedInvoices = useMemo(() => {
    return [...unpaidInvoices].sort((a, b) => {
      if (sortField === 'balance') {
        return sortOrder === 'asc' ? a.balance - b.balance : b.balance - a.balance;
      }
      
      // For string fields
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [unpaidInvoices, sortField, sortOrder]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />;
  };

  if (unpaidInvoices.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-amber-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Facturas sin Pagar
          </CardTitle>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            {unpaidInvoices.length} facturas - Total: {formatCurrency(totalUnpaid)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort('customer_name')}
                >
                  Cliente {renderSortIndicator('customer_name')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort('company_name')}
                >
                  Compañía {renderSortIndicator('company_name')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right" 
                  onClick={() => handleSort('balance')}
                >
                  Monto {renderSortIndicator('balance')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.map((invoice, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{invoice.customer_name}</TableCell>
                  <TableCell>{invoice.company_name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <span className={invoice.balance > 1000 ? 'text-red-600 font-semibold' : ''}>
                      {formatCurrency(invoice.balance)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnpaidInvoicesSection;
