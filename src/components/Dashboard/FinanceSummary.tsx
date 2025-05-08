
import React, { useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, Users, Scale } from 'lucide-react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign } from 'lucide-react';
import { formatCurrency, formatPercentage, safeParseNumber } from '@/utils/financialUtils';

interface FinanceSummaryProps {
  summary: FinancialSummary;
  expenseCategories?: CategorySummary[];
  stripeIncome?: number;
  regularIncome?: number;
  stripeOverride?: number | null;
}

const FinanceSummary: React.FC<FinanceSummaryProps> = ({ 
  summary, 
  expenseCategories = [],
  stripeIncome = 0,
  regularIncome = 0,
  stripeOverride = null
}) => {
  // Debug logging for component render
  useEffect(() => {
    console.log('🧩 FinanceSummary rendered with props:', { 
      summary, 
      stripeIncome, 
      regularIncome, 
      stripeOverride 
    });
  }, [summary, stripeIncome, regularIncome, stripeOverride]);

  // Ensure all values are numbers
  const totalIncome = safeParseNumber(summary.totalIncome);
  const totalExpense = safeParseNumber(summary.totalExpense);
  const collaboratorExpense = safeParseNumber(summary.collaboratorExpense || 0);
  const otherExpense = safeParseNumber(summary.otherExpense || 0);
  const profit = safeParseNumber(summary.profit);
  const profitMargin = safeParseNumber(summary.profitMargin);
  const startingBalance = summary.startingBalance !== undefined ? safeParseNumber(summary.startingBalance) : undefined;

  // Check if stripe income is using an override
  const isStripeOverridden = stripeOverride !== null;
  
  // Ensure all displayed values are numbers
  const safeStripeIncome = safeParseNumber(stripeIncome);
  const safeRegularIncome = safeParseNumber(regularIncome);

  console.log('FinanceSummary calculated values:', {
    totalIncome, 
    totalExpense,
    collaboratorExpense,
    otherExpense,
    profit,
    profitMargin,
    safeStripeIncome,
    safeRegularIncome,
    stripeOverride
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
            {startingBalance !== undefined ? formatCurrency(startingBalance) : "No establecido"}
          </div>
        </CardContent>
      </Card>

      {/* Ingresos Stripe */}
      <TooltipProvider>
        <Card className={`finance-card ${isStripeOverridden ? 'border-amber-300 shadow-amber-100' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Ingresos Stripe
                {isStripeOverridden && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-600">
                    Anulado
                  </span>
                )}
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 bg-green-50 rounded-full">
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                </TooltipTrigger>
                {isStripeOverridden && (
                  <TooltipContent>
                    <p>Valor anulado manualmente a {formatCurrency(stripeOverride || 0)}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            <div className="text-2xl font-bold text-green-500 animate-value">
              {formatCurrency(safeStripeIncome)}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

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
            {formatCurrency(safeRegularIncome)}
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
            {formatCurrency(totalIncome)}
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
            {formatCurrency(collaboratorExpense)}
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
            {formatCurrency(otherExpense)}
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
            {formatCurrency(totalExpense)}
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
              {formatCurrency(profit)}
            </div>
            <div className={`text-sm font-medium ml-2 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Margen: {formatPercentage(profitMargin)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceSummary;
