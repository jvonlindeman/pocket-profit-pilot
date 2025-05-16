
import React from 'react';
import { Transaction } from '@/types/financial';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactionProcessor } from '@/hooks/useTransactionProcessor';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';

interface TransactionCategorySummaryProps {
  transactions: Transaction[];
}

const TransactionCategorySummary: React.FC<TransactionCategorySummaryProps> = ({ transactions }) => {
  // Use our new hooks
  const { categorySummary } = useTransactionProcessor(transactions);
  const { formatCurrency } = useFinanceFormatter();
  
  // No transactions, don't show anything
  if (!transactions || transactions.length === 0) {
    return null;
  }
  
  const { byCategory: sortedExpenses, bySource: sortedIncome, totalExpense, totalIncome } = categorySummary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Expense Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-semibold text-red-700">
            Resumen de Gastos
            <span className="float-right">{formatCurrency(totalExpense)}</span>
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

export default React.memo(TransactionCategorySummary);
