
import React, { useMemo } from 'react';
import { Transaction } from '@/types/financial';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from 'lucide-react';
import { COLLABORATOR_IDENTIFIERS } from '@/hooks/useTransactionProcessor';

export interface FilterOptions {
  categories: Set<string>;
  sources: Set<string>;
  types: Set<string>;
  dateRange?: { from: Date; to: Date };
  minAmount?: number;
  maxAmount?: number;
}

export type FilterType = 'todos' | 'ingresos' | 'gastos' | 'colaboradores' | 'zoho_ingresos' | 'stripe_ingresos';

interface TransactionFiltersProps {
  transactions: Transaction[];
  onFilterChange: (filteredTransactions: Transaction[]) => void;
  onFilterOptionsChange?: (options: FilterOptions) => void;
  initialFilterType?: FilterType;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  transactions,
  onFilterChange,
  onFilterOptionsChange,
  initialFilterType = 'todos'
}) => {
  // Selected filter type
  const [filterType, setFilterType] = React.useState<FilterType>(initialFilterType);
  
  // Apply filters when selections change - memoized to avoid unnecessary recalculations
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Apply filter based on the current filter type
    switch (filterType) {
      case 'ingresos':
        return transactions.filter(t => t.type === 'income');
        
      case 'gastos':
        return transactions.filter(t => 
          t.type === 'expense' && 
          !COLLABORATOR_IDENTIFIERS.some(identifier => 
            t.category?.toLowerCase().includes(identifier.toLowerCase())
          )
        );
        
      case 'colaboradores':
        return transactions.filter(t => 
          t.type === 'expense' && 
          COLLABORATOR_IDENTIFIERS.some(identifier => 
            t.category?.toLowerCase().includes(identifier.toLowerCase())
          )
        );
        
      case 'zoho_ingresos':
        return transactions.filter(t => 
          t.type === 'income' && 
          t.source === 'Zoho'
        );
        
      case 'stripe_ingresos':
        return transactions.filter(t => 
          t.type === 'income' && 
          t.source === 'Stripe'
        );
        
      case 'todos':
      default:
        return [...transactions];
    }
  }, [filterType, transactions]);
  
  // Extract filter options - memoized
  const filterOptions = useMemo(() => {
    if (!filteredTransactions.length) {
      return {
        categories: new Set<string>(),
        sources: new Set<string>(),
        types: new Set<string>()
      };
    }
    
    return {
      categories: new Set(filteredTransactions.map(t => t.category).filter(Boolean)),
      sources: new Set(filteredTransactions.map(t => t.source).filter(Boolean)),
      types: new Set(filteredTransactions.map(t => t.type).filter(Boolean))
    };
  }, [filteredTransactions]);

  // Update parent component when filters change
  React.useEffect(() => {
    onFilterChange(filteredTransactions);
    
    if (onFilterOptionsChange) {
      onFilterOptionsChange(filterOptions);
    }
  }, [filteredTransactions, filterOptions, onFilterChange, onFilterOptionsChange]);

  // Handle filter type change
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as FilterType);
  };

  return (
    <div className="flex justify-end mb-4">
      <Select value={filterType} onValueChange={handleFilterTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">
            <div className="flex items-center">
              <Check className="mr-2 h-4 w-4 opacity-0 group-data-[state=checked]:opacity-100" />
              Todos
            </div>
          </SelectItem>
          <SelectItem value="ingresos">
            <div className="flex items-center">
              Ingresos
            </div>
          </SelectItem>
          <SelectItem value="gastos">
            <div className="flex items-center">
              Gastos
            </div>
          </SelectItem>
          <SelectItem value="colaboradores">
            <div className="flex items-center">
              Colaboradores
            </div>
          </SelectItem>
          <SelectItem value="zoho_ingresos">
            <div className="flex items-center">
              Zoho Ingresos
            </div>
          </SelectItem>
          <SelectItem value="stripe_ingresos">
            <div className="flex items-center">
              Stripe Ingresos
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(TransactionFilters);
