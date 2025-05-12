
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, BadgeDollarSign, Users, Scale } from 'lucide-react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import { Card, CardContent } from "@/components/ui/card";

interface FinanceSummaryProps {
  summary: FinancialSummary;
  expenseCategories?: CategorySummary[];
  stripeIncome?: number;
  regularIncome?: number;
}

const FinanceSummary: React.FC<FinanceSummaryProps> = ({ 
  summary, 
  expenseCategories = [],
  stripeIncome = 0,
  regularIncome = 0
}) => {
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

  // Log values to help debugging
  console.log("Finance Summary Data:", {
    startingBalance: summary.startingBalance,
    stripeIncome,
    regularIncome,
    totalIncome: summary.totalIncome,
    collaboratorExpense: summary.collaboratorExpense,
    otherExpense: summary.otherExpense,
    totalExpense: summary.totalExpense,
    profit: summary.profit,
    profitMargin: summary.profitMargin
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {/* Balance Inicial */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Balance Inicial</h3>
            <div className="p-2 bg-blue-50 rounded-full">
              <Scale className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-500 animate-value">
            {summary.startingBalance !== undefined ? formatCurrency(summary.startingBalance) : "No establecido"}
          </div>
        </CardContent>
      </Card>

      {/* Ingresos Stripe */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Ingresos Stripe</h3>
            <div className="p-2 bg-green-50 rounded-full">
              <BadgeDollarSign className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-500 animate-value">
            {formatCurrency(stripeIncome)}
          </div>
        </CardContent>
      </Card>

      {/* Ingresos Zoho */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Ingresos Zoho</h3>
            <div className="p-2 bg-green-50 rounded-full">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-500 animate-value">
            {formatCurrency(regularIncome)}
          </div>
        </CardContent>
      </Card>

      {/* Ingresos Totales */}
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

      {/* Gastos de Colaboradores */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Gastos Colaboradores</h3>
            <div className="p-2 bg-amber-50 rounded-full">
              <Users className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-500 animate-value">
            {formatCurrency(summary.collaboratorExpense || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Otros Gastos */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Otros Gastos</h3>
            <div className="p-2 bg-red-50 rounded-full">
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-500 animate-value">
            {formatCurrency(summary.otherExpense || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Gastos Totales */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Gastos Totales</h3>
            <div className="p-2 bg-red-50 rounded-full">
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-500 animate-value">
            {formatCurrency(summary.totalExpense || 0)}
          </div>
        </CardContent>
      </Card>

      {/* Beneficio */}
      <Card className="finance-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Beneficio Bruto</h3>
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
