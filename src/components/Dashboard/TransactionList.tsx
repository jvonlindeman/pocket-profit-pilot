
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/types/financial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CacheStats from './CacheStats';
import { Info, Filter, DollarSign, MinusCircle, Users, Coins, Table as TableIcon } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

type TransactionFilter = 'all' | 'income' | 'expense' | 'collaborator' | 'zoho-income' | 'stripe-income';

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onRefresh, isLoading = false }) => {
  // Main transaction type filter
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('all');
  // Category filter for expenses
  const [categoryFilter, setcategoryFilter] = useState<string>('all');

  // Extract unique expense categories from transactions
  const expenseCategories = useMemo(() => {
    const categories = transactions
      .filter(tx => tx.type === 'expense')
      .map(tx => tx.category)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    return ['all', ...categories];
  }, [transactions]);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    // Apply transaction type filter
    switch (typeFilter) {
      case 'all':
        // No filtering needed
        break;
      case 'income':
        result = result.filter(tx => tx.type === 'income');
        break;
      case 'expense':
        result = result.filter(tx => tx.type === 'expense');
        // Apply category filter if it's not 'all'
        if (categoryFilter !== 'all') {
          result = result.filter(tx => tx.category === categoryFilter);
        }
        break;
      case 'collaborator':
        // Filter for collaborator expenses specifically
        result = result.filter(tx => tx.type === 'expense' && tx.category.toLowerCase().includes('colaborador'));
        break;
      case 'zoho-income':
        result = result.filter(tx => tx.type === 'income' && tx.source === 'Zoho');
        break;
      case 'stripe-income':
        result = result.filter(tx => tx.type === 'income' && tx.source === 'Stripe');
        break;
      default:
        break;
    }
    
    return result;
  }, [transactions, typeFilter, categoryFilter]);

  // Calculate transaction sums by category
  const categorySums = useMemo(() => {
    const sums: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Calculate sums for each category in filtered transactions
    filteredTransactions.forEach(tx => {
      const category = tx.category;
      if (!sums[category]) {
        sums[category] = 0;
      }
      sums[category] += tx.amount;
      
      // Also track totals by type
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
      }
    });
    
    // Add totals
    sums['_totalIncome'] = totalIncome;
    sums['_totalExpense'] = totalExpense;
    sums['_netAmount'] = totalIncome - totalExpense;
    
    return sums;
  }, [filteredTransactions]);

  // Reset category filter when transaction type changes
  useEffect(() => {
    setcategoryFilter('all');
  }, [typeFilter]);

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

  // Format currency (showing in USD by default)
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
      toast({
        title: "Actualizando datos",
        description: "Obteniendo transacciones más recientes..."
      });
    }
  };

  // Generate summary rows for footer based on current filter
  const getSummaryRows = () => {
    const summaryRows = [];
    
    // Helper to decide which summaries to show based on filter type
    const isRelevantCategory = (category: string) => {
      // Skip internal total keys
      if (category.startsWith('_')) return false;
      
      // For expense filters, only show relevant categories
      if (typeFilter === 'expense' && categoryFilter !== 'all') {
        return category === categoryFilter;
      }
      
      // For collaborator filter, only show collaborator categories
      if (typeFilter === 'collaborator') {
        return category.toLowerCase().includes('colaborador');
      }
      
      // For income filters, only show income categories
      if (typeFilter === 'income' || typeFilter === 'zoho-income' || typeFilter === 'stripe-income') {
        const isIncomeCategory = filteredTransactions
          .filter(tx => tx.category === category)
          .some(tx => tx.type === 'income');
        return isIncomeCategory;
      }
      
      return true;
    };
    
    // Add category subtotals if there are transactions with those categories
    Object.keys(categorySums)
      .filter(isRelevantCategory)
      .sort()
      .forEach(category => {
        const amount = categorySums[category];
        if (amount > 0) {
          summaryRows.push(
            <TableRow key={`summary-${category}`}>
              <TableCell colSpan={4} className="font-medium text-right">
                Subtotal: {category}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(amount)}
              </TableCell>
            </TableRow>
          );
        }
      });
    
    // Add total row based on filter
    if (filteredTransactions.length > 0) {
      if (typeFilter === 'income' || typeFilter === 'zoho-income' || typeFilter === 'stripe-income') {
        // Only show income total
        summaryRows.push(
          <TableRow key="total-income" className="bg-green-50">
            <TableCell colSpan={4} className="font-bold text-right">
              Total Ingresos
            </TableCell>
            <TableCell className="text-right font-bold text-green-600">
              {formatCurrency(categorySums._totalIncome)}
            </TableCell>
          </TableRow>
        );
      } else if (typeFilter === 'expense' || typeFilter === 'collaborator') {
        // Only show expense total
        summaryRows.push(
          <TableRow key="total-expense" className="bg-red-50">
            <TableCell colSpan={4} className="font-bold text-right">
              Total Gastos
            </TableCell>
            <TableCell className="text-right font-bold text-red-600">
              {formatCurrency(categorySums._totalExpense)}
            </TableCell>
          </TableRow>
        );
      } else {
        // Show both income and expense totals, and net amount
        summaryRows.push(
          <TableRow key="total-income" className="bg-green-50">
            <TableCell colSpan={4} className="font-bold text-right">
              Total Ingresos
            </TableCell>
            <TableCell className="text-right font-bold text-green-600">
              {formatCurrency(categorySums._totalIncome)}
            </TableCell>
          </TableRow>
        );
        summaryRows.push(
          <TableRow key="total-expense" className="bg-red-50">
            <TableCell colSpan={4} className="font-bold text-right">
              Total Gastos
            </TableCell>
            <TableCell className="text-right font-bold text-red-600">
              {formatCurrency(categorySums._totalExpense)}
            </TableCell>
          </TableRow>
        );
        summaryRows.push(
          <TableRow key="net-amount" className={categorySums._netAmount >= 0 ? "bg-blue-50" : "bg-amber-50"}>
            <TableCell colSpan={4} className="font-bold text-right">
              Saldo Neto
            </TableCell>
            <TableCell className={`text-right font-bold ${categorySums._netAmount >= 0 ? "text-blue-600" : "text-amber-600"}`}>
              {formatCurrency(categorySums._netAmount)}
            </TableCell>
          </TableRow>
        );
      }
    }
    
    return summaryRows;
  };

  return (
    <>
      {onRefresh && (
        <CacheStats onRefresh={handleRefresh} isLoading={isLoading || false} />
      )}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Transacciones</CardTitle>
              <CardDescription>Lista detallada de ingresos y gastos en USD</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Transaction Type Filter */}
              <Select value={typeFilter} onValueChange={(value: TransactionFilter) => setTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                  <SelectItem value="collaborator">Colaboradores</SelectItem>
                  <SelectItem value="zoho-income">Zoho Ingresos</SelectItem>
                  <SelectItem value="stripe-income">Stripe Ingresos</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Category Filter - Only show when expense filter is active */}
              {typeFilter === 'expense' && expenseCategories.length > 1 && (
                <Select value={categoryFilter} onValueChange={setcategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'Todas las categorías' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
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
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.type === 'expense' && <MinusCircle size={16} className="text-red-500 mr-2" />}
                        {transaction.type === 'income' && <DollarSign size={16} className="text-green-500 mr-2" />}
                        {transaction.category === 'Pagos a colaboradores' && <Users size={16} className="text-blue-500 mr-2" />}
                        {transaction.category}
                      </div>
                    </TableCell>
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
            {filteredTransactions.length > 0 && (
              <TableFooter>
                {getSummaryRows()}
              </TableFooter>
            )}
          </Table>
        </CardContent>
        {filteredTransactions.length > 0 && (
          <CardFooter className="flex justify-end bg-slate-50 pt-4 pb-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <TableIcon size={16} className="mr-2" />
              <span>Mostrando {filteredTransactions.length} transacciones</span>
            </div>
          </CardFooter>
        )}
      </Card>
    </>
  );
};

export default TransactionList;
