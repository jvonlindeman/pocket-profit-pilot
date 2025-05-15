
import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { Transaction } from '@/types/financial';
import { Skeleton } from '@/components/ui/skeleton';
import CacheInfo from './CacheInfo';
import TransactionFilters, { FilterOptions } from './TransactionFilters';
import TransactionCategorySummary from './TransactionCategorySummary';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: () => void;
  isLoading: boolean;
  dateRange?: { startDate: Date; endDate: Date };
  cacheStatus?: {
    zoho: { hit: boolean, partial: boolean },
    stripe: { hit: boolean, partial: boolean }
  };
  isUsingCache?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onRefresh,
  isLoading,
  dateRange,
  cacheStatus,
  isUsingCache
}) => {
  // Add default values for optional props
  const cacheProps = {
    dateRange: dateRange || { startDate: new Date(), endDate: new Date() },
    cacheStatus: cacheStatus || {
      zoho: { hit: false, partial: false },
      stripe: { hit: false, partial: false }
    },
    isUsingCache: isUsingCache || false,
    onRefresh
  };

  // State for filtered transactions
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  
  // Handle filter change
  const handleFilterChange = (filtered: Transaction[]) => {
    setFilteredTransactions(filtered);
  };
  
  // Update filtered transactions when original transactions change
  useMemo(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);
  
  return (
    <div className="space-y-4">
      {/* Cache information */}
      {dateRange && cacheStatus && (
        <CacheInfo 
          dateRange={dateRange}
          cacheStatus={cacheStatus}
          isUsingCache={isUsingCache || false}
          onRefresh={onRefresh}
        />
      )}
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Transacciones</h2>
          <p className="text-sm text-gray-500">Lista detallada de ingresos y gastos en USD</p>
        </div>
        <div className="flex items-center gap-2">
          <TransactionFilters 
            transactions={transactions} 
            onFilterChange={handleFilterChange}
            onFilterOptionsChange={setFilterOptions}
          />
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>
      
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
              ) : filteredTransactions.length > 0 ? (
                // Mostrar datos si hay transacciones
                filteredTransactions.map((transaction) => {
                  // Create a unique key using multiple properties to avoid duplicate keys
                  const transactionKey = `${transaction.id}-${transaction.date}-${transaction.amount}-${transaction.description?.substring(0, 10) || ''}`;
                  
                  return (
                    <TableRow key={transactionKey}>
                      <TableCell>{formatDateForDisplay(transaction.date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {transaction.type === 'expense' && (
                            <span className={`mr-2 ${transaction.category?.toLowerCase().includes('colaborador') ? 'text-amber-500' : 'text-red-500'} rounded-full`}>⬤</span>
                          )}
                          <span className="px-2 py-1 text-gray-700 rounded text-sm">
                            {transaction.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.source}</TableCell>
                      <TableCell className={`text-right ${transaction.type === 'expense' ? transaction.category?.toLowerCase().includes('colaborador') ? 'text-amber-600' : 'text-red-600' : 'text-green-600'} font-medium`}>
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
      
      {/* Category Summary */}
      <TransactionCategorySummary transactions={filteredTransactions} />
    </div>
  );
};

export default TransactionList;
