
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Transaction } from '@/types/financial';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { COLLABORATOR_IDENTIFIER } from '@/hooks/useTransactionProcessor';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading
}) => {
  const { formatCurrency } = useFinanceFormatter();

  // Helper function to determine transaction color
  const getTransactionColorClass = (transaction: Transaction): string => {
    if (transaction.type === 'expense') {
      return transaction.category?.toLowerCase().includes(COLLABORATOR_IDENTIFIER)
        ? 'text-amber-600'
        : 'text-red-600';
    }
    return 'text-green-600';
  };

  // Helper function to determine indicator color
  const getCategoryIndicatorClass = (transaction: Transaction): string => {
    if (transaction.type === 'expense') {
      return transaction.category?.toLowerCase().includes(COLLABORATOR_IDENTIFIER)
        ? 'text-amber-500'
        : 'text-red-500';
    }
    return '';
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Mostrar skeletons al cargar
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[80px]" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length > 0 ? (
              // Mostrar datos si hay transacciones
              transactions.map((transaction) => {
                // Create a unique key using multiple properties to avoid duplicate keys
                const transactionKey = `${transaction.id}-${transaction.date}-${transaction.amount}-${transaction.description?.substring(0, 10) || ''}`;
                const colorClass = getTransactionColorClass(transaction);
                const indicatorClass = getCategoryIndicatorClass(transaction);
                
                return (
                  <TableRow key={transactionKey}>
                    <TableCell>{formatDateForDisplay(transaction.date)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.type === 'expense' && (
                          <span className={`mr-2 ${indicatorClass} rounded-full`}>⬤</span>
                        )}
                        <span className="px-2 py-1 text-gray-700 rounded text-sm">
                          {transaction.category}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.source}</TableCell>
                    <TableCell className={`text-right ${colorClass} font-medium`}>
                      {transaction.type === 'expense' ? '-' : ''}${transaction.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Mostrar mensaje si no hay transacciones
              <TableRow>
                <TableCell colSpan={5} className="text-center">No hay transacciones disponibles con los filtros seleccionados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default React.memo(TransactionTable);
