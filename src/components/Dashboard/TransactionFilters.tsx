
import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  TagIcon, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  CalendarIcon
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Transaction } from '@/types/financial';

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
  // Extract all unique categories, sources, and types
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allSources, setAllSources] = useState<string[]>([]);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  
  // Selected filters
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  
  // UI State
  const [showCategoryFilters, setShowCategoryFilters] = useState(true);
  const [showSourceFilters, setShowSourceFilters] = useState(true);
  const [showTypeFilters, setShowTypeFilters] = useState(true);
  
  // Initialize filters based on available transactions
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const categories = [...new Set(transactions.map(t => t.category))].filter(Boolean).sort();
      const sources = [...new Set(transactions.map(t => t.source))].sort();
      const types = [...new Set(transactions.map(t => t.type))].sort();
      
      setAllCategories(categories);
      setAllSources(sources);
      setAllTypes(types);
      
      // Default select all
      setSelectedCategories(new Set(categories));
      setSelectedSources(new Set(sources));
      setSelectedTypes(new Set(types));
    }
  }, [transactions]);

  // Apply filters when selections change
  useEffect(() => {
    if (transactions) {
      const filtered = transactions.filter(transaction => {
        const categoryMatch = !transaction.category || selectedCategories.has(transaction.category);
        const sourceMatch = !transaction.source || selectedSources.has(transaction.source);
        const typeMatch = !transaction.type || selectedTypes.has(transaction.type);
        
        return categoryMatch && sourceMatch && typeMatch;
      });
      
      onFilterChange(filtered);
      
      if (onFilterOptionsChange) {
        onFilterOptionsChange({
          categories: selectedCategories,
          sources: selectedSources,
          types: selectedTypes
        });
      }
    }
  }, [selectedCategories, selectedSources, selectedTypes, transactions, onFilterChange, onFilterOptionsChange]);

  // Handle category selection
  const handleCategoryChange = (category: string, checked: boolean) => {
    const newSelectedCategories = new Set(selectedCategories);
    if (checked) {
      newSelectedCategories.add(category);
    } else {
      newSelectedCategories.delete(category);
    }
    setSelectedCategories(newSelectedCategories);
  };

  // Handle source selection
  const handleSourceChange = (source: string, checked: boolean) => {
    const newSelectedSources = new Set(selectedSources);
    if (checked) {
      newSelectedSources.add(source);
    } else {
      newSelectedSources.delete(source);
    }
    setSelectedSources(newSelectedSources);
  };

  // Handle type selection
  const handleTypeChange = (type: string, checked: boolean) => {
    const newSelectedTypes = new Set(selectedTypes);
    if (checked) {
      newSelectedTypes.add(type);
    } else {
      newSelectedTypes.delete(type);
    }
    setSelectedTypes(newSelectedTypes);
  };

  // Select all in a category
  const selectAllCategories = () => {
    setSelectedCategories(new Set(allCategories));
  };

  // Clear all in a category
  const clearAllCategories = () => {
    setSelectedCategories(new Set());
  };

  // Select all sources
  const selectAllSources = () => {
    setSelectedSources(new Set(allSources));
  };

  // Clear all sources
  const clearAllSources = () => {
    setSelectedSources(new Set());
  };

  // Select all types
  const selectAllTypes = () => {
    setSelectedTypes(new Set(allTypes));
  };

  // Clear all types
  const clearAllTypes = () => {
    setSelectedTypes(new Set());
  };

  return (
    <div className="space-y-4 p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          Filtros
        </h3>
        
        <div className="flex space-x-2">
          <Badge variant="secondary" className="text-xs">
            {`${selectedCategories.size}/${allCategories.length} categorías`}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {`${selectedSources.size}/${allSources.length} fuentes`}
          </Badge>
        </div>
      </div>
      
      <Separator />
      
      {/* Category Filters */}
      <div className="space-y-2">
        <div 
          className="flex justify-between cursor-pointer" 
          onClick={() => setShowCategoryFilters(!showCategoryFilters)}
        >
          <h4 className="text-sm font-medium flex items-center">
            <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
            Categorías
          </h4>
          {showCategoryFilters ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
          }
        </div>
        
        {showCategoryFilters && (
          <div className="pl-6 space-y-2">
            <div className="flex justify-between text-xs mb-2">
              <button 
                onClick={selectAllCategories} 
                className="text-blue-600 hover:underline"
              >
                Seleccionar todo
              </button>
              <button 
                onClick={clearAllCategories} 
                className="text-blue-600 hover:underline"
              >
                Limpiar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allCategories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category}`} 
                    checked={selectedCategories.has(category)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category, checked === true)
                    }
                  />
                  <Label 
                    htmlFor={`category-${category}`} 
                    className="text-sm"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Source Filters */}
      <div className="space-y-2">
        <div 
          className="flex justify-between cursor-pointer" 
          onClick={() => setShowSourceFilters(!showSourceFilters)}
        >
          <h4 className="text-sm font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
            Fuentes
          </h4>
          {showSourceFilters ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
          }
        </div>
        
        {showSourceFilters && (
          <div className="pl-6 space-y-2">
            <div className="flex justify-between text-xs mb-2">
              <button 
                onClick={selectAllSources} 
                className="text-blue-600 hover:underline"
              >
                Seleccionar todo
              </button>
              <button 
                onClick={clearAllSources} 
                className="text-blue-600 hover:underline"
              >
                Limpiar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allSources.map(source => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`source-${source}`} 
                    checked={selectedSources.has(source)}
                    onCheckedChange={(checked) => 
                      handleSourceChange(source, checked === true)
                    }
                  />
                  <Label 
                    htmlFor={`source-${source}`} 
                    className="text-sm"
                  >
                    {source}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Type Filters */}
      <div className="space-y-2">
        <div 
          className="flex justify-between cursor-pointer" 
          onClick={() => setShowTypeFilters(!showTypeFilters)}
        >
          <h4 className="text-sm font-medium flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
            Tipos
          </h4>
          {showTypeFilters ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
          }
        </div>
        
        {showTypeFilters && (
          <div className="pl-6 space-y-2">
            <div className="flex justify-between text-xs mb-2">
              <button 
                onClick={selectAllTypes} 
                className="text-blue-600 hover:underline"
              >
                Seleccionar todo
              </button>
              <button 
                onClick={clearAllTypes} 
                className="text-blue-600 hover:underline"
              >
                Limpiar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`} 
                    checked={selectedTypes.has(type)}
                    onCheckedChange={(checked) => 
                      handleTypeChange(type, checked === true)
                    }
                  />
                  <Label 
                    htmlFor={`type-${type}`} 
                    className="text-sm"
                  >
                    {type === 'income' ? 'Ingresos' : 'Gastos'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;
