
import React from 'react';
import { Transaction } from '@/types/financial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface IncomeTransactionsProps {
  transactions: Transaction[];
}

const IncomeTransactions: React.FC<IncomeTransactionsProps> = ({ transactions }) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error(`Invalid date string: ${dateString}`);
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('es-ES').format(date);
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate total income
  const totalIncome = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-green-50 p-4 rounded-md mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-green-800">Ingresos</h3>
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
          Total: {formatCurrency(totalIncome)}
        </Badge>
      </div>
      
      <Table>
        <TableHeader className="bg-green-100">
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead className="text-right">Importe (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                No hay ingresos que mostrar
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow 
                key={transaction.id} 
                className={`hover:bg-green-100/50 ${
                  transaction.description.includes('(Manual)') ? 'bg-green-50' : ''
                }`}
              >
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell>
                  {transaction.description.includes('(Manual)') 
                    ? transaction.description.replace(' (Manual)', '') 
                    : transaction.description}
                  {transaction.description.includes('(Manual)') && (
                    <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      Override
                    </span>
                  )}
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.source}</TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  + {formatCurrency(transaction.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default IncomeTransactions;
