
import React, { useState, useEffect } from 'react';
import { Transaction } from '@/types/financial';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from 'lucide-react';

export interface FilterOptions {
  categories: Set<string>;
  sources: Set<string>;
  types: Set<string>;
  dateRange?: { from: Date; to: Date };
  minAmount?: number;
  maxAmount?: number;
}

interface TransactionFiltersProps {
  transactions: Transaction[];
  onFilterChange: (filteredTransactions: Transaction[]) => void;
  onFilterOptionsChange?: (options: FilterOptions) => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  transactions,
  onFilterChange,
  onFilterOptionsChange
}) => {
  // Selected filter type
  const [filterType, setFilterType] = useState<string>("todos");
  
  // Apply filters when selections change
  useEffect(() => {
    if (transactions) {
      let filtered = [...transactions];
      
      // Apply filters based on selected type
      switch (filterType) {
        case "ingresos":
          filtered = filtered.filter(t => t.type === 'income');
          break;
        case "gastos":
          filtered = filtered.filter(t => t.type === 'expense');
          break;
        case "colaboradores":
          filtered = filtered.filter(t => 
            t.type === 'expense' && 
            t.category?.toLowerCase().includes('colaborador')
          );
          break;
        case "zoho_ingresos":
          filtered = filtered.filter(t => 
            t.type === 'income' && 
            t.source === 'Zoho'
          );
          break;
        case "stripe_ingresos":
          filtered = filtered.filter(t => 
            t.type === 'income' && 
            t.source === 'Stripe'
          );
          break;
        case "todos":
        default:
          // No filtering needed for "todos"
          break;
      }
      
      onFilterChange(filtered);
      
      if (onFilterOptionsChange) {
        // Extract all unique categories, sources, and types from filtered results
        const categories = new Set(filtered.map(t => t.category).filter(Boolean));
        const sources = new Set(filtered.map(t => t.source).filter(Boolean));
        const types = new Set(filtered.map(t => t.type).filter(Boolean));
        
        onFilterOptionsChange({
          categories,
          sources,
          types
        });
      }
    }
  }, [filterType, transactions, onFilterChange, onFilterOptionsChange]);

  // Handle filter type change
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
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

export default TransactionFilters;
