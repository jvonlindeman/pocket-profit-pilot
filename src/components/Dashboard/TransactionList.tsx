
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
        <h3 className="text-lg font-semibold">Lista de Transacciones</h3>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
      
      {/* Transaction Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <TransactionFilters 
            transactions={transactions} 
            onFilterChange={handleFilterChange}
            onFilterOptionsChange={setFilterOptions}
          />
        </div>
        
        <div className="lg:col-span-3">
          <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
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
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDateForDisplay(transaction.date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.source}</TableCell>
                      <TableCell className={`text-right ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'expense' ? '-' : ''}${transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Mostrar mensaje si no hay transacciones
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No hay transacciones disponibles con los filtros seleccionados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Category Summary */}
          <TransactionCategorySummary transactions={filteredTransactions} />
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
