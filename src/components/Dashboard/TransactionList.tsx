
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
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CacheStats from './CacheStats';
import { Info } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onRefresh, isLoading = false }) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // Aplicamos filtro
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  // Formato de fecha
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

  // Formato de moneda (ahora mostramos en USD por defecto)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      {onRefresh && (
        <CacheStats onRefresh={handleRefresh} isLoading={isLoading || false} />
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Ingresos</SelectItem>
                <SelectItem value="expense">Gastos</SelectItem>
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
                    <TableCell>
                      {transaction.source === 'Stripe' && transaction.fees ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center">
                              {transaction.source}
                              <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Comisión de Stripe: {formatCurrency(transaction.fees)}</p>
                              {transaction.gross && (
                                <p>Importe bruto: {formatCurrency(transaction.gross)}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        transaction.source
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'income-text' : 'expense-text'}`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default TransactionList;
