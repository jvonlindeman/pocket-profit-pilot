
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Transaction } from '@/types/financial';
import CacheInfo from './CacheInfo';
import TransactionFilters, { FilterOptions } from './TransactionFilters';
import TransactionCategorySummary from './TransactionCategorySummary';
import TransactionTable from './TransactionTable';
import { useIsMobile } from '@/hooks/use-mobile';

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
  // State for filtered transactions
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const isMobile = useIsMobile();
  
  // Update filtered transactions when original transactions change
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);
  
  // Handle filter change
  const handleFilterChange = (filtered: Transaction[]) => {
    setFilteredTransactions(filtered);
  };
  
  // Cache info props
  const cacheProps = {
    dateRange: dateRange || { startDate: new Date(), endDate: new Date() },
    cacheStatus: cacheStatus || {
      zoho: { hit: false, partial: false },
      stripe: { hit: false, partial: false }
    },
    isUsingCache: isUsingCache || false,
    onRefresh
  };
  
  return (
    <div className="space-y-4">
      {/* Cache information */}
      {dateRange && cacheStatus && (
        <CacheInfo {...cacheProps} />
      )}
      
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between items-center'} mb-4`}>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Transacciones</h2>
          <p className="text-sm text-gray-500">Lista detallada de ingresos y gastos en USD</p>
        </div>
        <div className={`flex ${isMobile ? 'mt-2 space-x-2' : 'items-center gap-2'}`}>
          <TransactionFilters 
            transactions={transactions} 
            onFilterChange={handleFilterChange}
            onFilterOptionsChange={setFilterOptions}
          />
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {isMobile ? "Actualizar" : "Actualizar"}
          </Button>
        </div>
      </div>
      
      {/* Transaction table component */}
      <TransactionTable 
        transactions={filteredTransactions}
        isLoading={isLoading}
      />
      
      {/* Category Summary */}
      <TransactionCategorySummary transactions={filteredTransactions} />
    </div>
  );
};

export default React.memo(TransactionList);
