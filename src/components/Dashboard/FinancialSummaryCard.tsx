
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialSummary } from '@/types/financial';
import { formatCurrency } from '@/utils/financialUtils';

interface FinancialSummaryCardProps {
  summary: FinancialSummary;
  startingBalance: number | null;
  isLoading: boolean;
  onRefreshClick: (force: boolean) => void;
}

const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  summary,
  startingBalance,
  isLoading,
  onRefreshClick
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Financiero</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Balance Inicial</p>
            <p className="text-lg font-semibold">{formatCurrency(startingBalance || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ingresos</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gastos</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(summary.totalExpense)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Balance Final</p>
            <p className={`text-lg font-semibold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.profit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;
