
import React from 'react';
import { Transaction } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

interface CategoryTotal {
  category: string;
  amount: number;
  count: number;
}

interface CategorySummaryProps {
  transactions: Transaction[];
}

const TransactionCategorySummary: React.FC<CategorySummaryProps> = ({ transactions }) => {
  // No transactions, don't show anything
  if (!transactions || transactions.length === 0) {
    return null;
  }
  
  // Group transactions by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = {
          category,
          amount: 0,
          count: 0
        };
      }
      acc[category].amount += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, CategoryTotal>);
    
  // Group transactions by source
  const incomeBySource = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, transaction) => {
      const source = transaction.source || 'Sin fuente';
      if (!acc[source]) {
        acc[source] = {
          category: source,
          amount: 0,
          count: 0
        };
      }
      acc[source].amount += transaction.amount;
      acc[source].count += 1;
      return acc;
    }, {} as Record<string, CategoryTotal>);
    
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calculate totals
  const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.amount, 0);
  const totalIncome = Object.values(incomeBySource).reduce((sum, src) => sum + src.amount, 0);
  
  // Sort by amount (descending)
  const sortedExpenses = Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount);
  const sortedIncome = Object.values(incomeBySource).sort((a, b) => b.amount - a.amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Expense Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-semibold text-red-700">
            Resumen de Gastos
            <span className="float-right">{formatCurrency(totalExpenses)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {sortedExpenses.map(item => (
              <div key={item.category} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="mr-2">{item.category}</span>
                  <span className="text-xs text-gray-500">({item.count})</span>
                </div>
                <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            
            {sortedExpenses.length === 0 && (
              <div className="text-sm text-center text-gray-500 py-2">
                No hay gastos para mostrar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Income Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-semibold text-green-700">
            Resumen de Ingresos
            <span className="float-right">{formatCurrency(totalIncome)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {sortedIncome.map(item => (
              <div key={item.category} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="mr-2">{item.category}</span>
                  <span className="text-xs text-gray-500">({item.count})</span>
                </div>
                <span className="font-medium text-green-600">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            
            {sortedIncome.length === 0 && (
              <div className="text-sm text-center text-gray-500 py-2">
                No hay ingresos para mostrar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionCategorySummary;
