
import React, { useState } from 'react';
import { Transaction } from '@/types/financial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CacheStats from './CacheStats';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh?: () => void;
  isLoading?: boolean;
  startDate?: Date;
  endDate?: Date;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onRefresh, 
  isLoading = false,
  startDate,
  endDate
}) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // Apply filter
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

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

  // Calculate totals
  const getTotals = () => {
    const incomeTotal = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const expenseTotal = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    return { incomeTotal, expenseTotal, netTotal: incomeTotal - expenseTotal };
  };
  
  const totals = getTotals();

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Count transactions by type
  const incomeTransactions = transactions.filter(tx => tx.type === 'income').length;
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense').length;

  return (
    <>
      {onRefresh && (
        <CacheStats 
          onRefresh={handleRefresh} 
          isLoading={isLoading || false} 
          startDate={startDate}
          endDate={endDate}
        />
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transacciones</CardTitle>
              <CardDescription>Lista detallada de ingresos y gastos en USD</CardDescription>
            </div>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({transactions.length})</SelectItem>
                <SelectItem value="income">Ingresos ({incomeTransactions})</SelectItem>
                <SelectItem value="expense">Gastos ({expenseTransactions})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="finance-table">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="text-right">Importe (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    No hay transacciones que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.source}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'income-text' : 'expense-text'}`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t text-sm text-gray-500 flex flex-col sm:flex-row sm:justify-between p-4">
          <div className="mb-2 sm:mb-0">
            <span>
              Mostrando {filteredTransactions.length} de {transactions.length} transacciones
              {filter !== 'all' && (
                <> ({filter === 'income' ? 'ingresos' : 'gastos'})</>
              )}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="text-blue-600 font-medium">
              Ingresos: {formatCurrency(totals.incomeTotal)} ({incomeTransactions})
            </div>
            <div className="text-red-600 font-medium">
              Gastos: {formatCurrency(totals.expenseTotal)} ({expenseTransactions})
            </div>
            <div className={`font-semibold ${totals.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Neto: {formatCurrency(totals.netTotal)}
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default TransactionList;
