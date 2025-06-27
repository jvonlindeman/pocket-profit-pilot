
import React from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinanceFormatter } from '@/hooks/useFinanceFormatter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ExpenseCalculationVerifier: React.FC = () => {
  const { summary, transactions } = useFinance();
  const { formatCurrency } = useFinanceFormatter();

  // Calculate verification metrics
  const stripeTransactions = transactions.filter(tx => tx.source === 'Stripe');
  const stripeExpenses = stripeTransactions.filter(tx => tx.type === 'expense');
  const stripeFees = stripeExpenses.filter(tx => 
    tx.amount < 0 || 
    tx.category?.toLowerCase().includes('fee') ||
    tx.description?.toLowerCase().includes('fee') ||
    tx.description?.toLowerCase().includes('billing')
  );
  
  const totalStripeFees = stripeFees.reduce((sum, tx) => sum + tx.amount, 0);
  const calculationVerification = Math.abs((summary.collaboratorExpense + summary.otherExpense) - summary.totalExpense) < 0.01;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          Verificación de Cálculos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stripe Fees Detection */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Comisiones Stripe detectadas:</span>
          <div className="flex items-center gap-2">
            <Badge variant={stripeFees.length > 0 ? "default" : "secondary"}>
              {stripeFees.length} transacciones
            </Badge>
            <span className="text-xs font-mono">{formatCurrency(totalStripeFees)}</span>
          </div>
        </div>

        {/* Expense Calculation Verification */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Verificación de gastos:</span>
          <div className="flex items-center gap-2">
            {calculationVerification ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <Badge variant={calculationVerification ? "default" : "destructive"}>
              {calculationVerification ? "Correcto" : "Error"}
            </Badge>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="text-xs space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span className="text-gray-500">Gastos Colaboradores:</span>
            <span className="font-mono">{formatCurrency(summary.collaboratorExpense)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Otros Gastos:</span>
            <span className="font-mono">{formatCurrency(summary.otherExpense)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total Gastos:</span>
            <span className="font-mono">{formatCurrency(summary.totalExpense)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Suma (Colab + Otros):</span>
            <span className="font-mono">{formatCurrency(summary.collaboratorExpense + summary.otherExpense)}</span>
          </div>
        </div>

        {/* Stripe Fees List (if any detected) */}
        {stripeFees.length > 0 && (
          <div className="text-xs pt-2 border-t">
            <div className="text-gray-500 mb-1">Comisiones excluidas:</div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {stripeFees.slice(0, 3).map((fee, index) => (
                <div key={index} className="flex justify-between text-gray-400">
                  <span className="truncate max-w-[120px]">{fee.description}</span>
                  <span className="font-mono">{formatCurrency(fee.amount)}</span>
                </div>
              ))}
              {stripeFees.length > 3 && (
                <div className="text-center text-gray-400">
                  +{stripeFees.length - 3} más...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseCalculationVerifier;
