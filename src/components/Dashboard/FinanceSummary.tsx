
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, Wallet } from 'lucide-react';
import { FinancialSummary as FinanceSummaryType } from '@/types/financial';
import { Card, CardContent } from "@/components/ui/card";

interface FinanceSummaryProps {
  summary: FinanceSummaryType;
}

const FinanceSummary: React.FC<FinanceSummaryProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      {/* Ingresos */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Ingresos Totales</h3>
            <div className="p-2 bg-green-50 rounded-full">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-500 animate-value">
            {formatCurrency(summary.totalIncome)}
          </div>
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Gastos Totales</h3>
            <div className="p-2 bg-red-50 rounded-full">
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-500 animate-value">
            {formatCurrency(summary.totalExpense)}
          </div>
          <div className="mt-2 flex flex-col text-sm text-gray-500">
            <div className="flex justify-between items-center">
              <span>Servicios y proveedores</span>
              <span className="font-medium">{formatCurrency(summary.totalExpense * 0.65)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span>Contratistas y empleados</span>
              <span className="font-medium">{formatCurrency(summary.totalExpense * 0.35)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficio */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Beneficio Neto</h3>
            <div className="p-2 bg-blue-50 rounded-full">
              <TrendingUpIcon className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-blue-500 animate-value">
              {formatCurrency(summary.profit)}
            </div>
            <div className={`text-sm font-medium ml-2 ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Margen: {formatPercentage(summary.profitMargin)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceSummary;
