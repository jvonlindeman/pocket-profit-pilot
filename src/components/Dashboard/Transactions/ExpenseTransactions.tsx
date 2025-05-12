
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseTransactionsProps {
  transactions: Transaction[];
}

const ExpenseTransactions: React.FC<ExpenseTransactionsProps> = ({ transactions }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Get unique categories
  const categories = ['all', ...new Set(transactions.map(tx => tx.category))];
  
  // Filter transactions by category
  const filteredTransactions = categoryFilter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.category === categoryFilter);
  
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

  // Calculate total expenses
  const totalExpenses = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-red-50 p-4 rounded-md mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-red-800">Gastos</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Total: {formatCurrency(totalExpenses)}
          </Badge>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-white border-red-200 focus:ring-red-500">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.filter(cat => cat !== 'all').map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Table>
        <TableHeader className="bg-red-100">
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
                No hay gastos que mostrar {categoryFilter !== 'all' && `para la categoría "${categoryFilter}"`}
              </TableCell>
            </TableRow>
          ) : (
            filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-red-100/50">
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-white">
                    {transaction.category}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.source}</TableCell>
                <TableCell className="text-right font-medium text-red-600">
                  - {formatCurrency(transaction.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpenseTransactions;
