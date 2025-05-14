
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, BadgeDollarSign, Users, Scale, Scissors, Calculator } from 'lucide-react';
import { FinancialSummary, CategorySummary } from '@/types/financial';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinanceSummaryProps {
  summary: FinancialSummary;
  expenseCategories?: CategorySummary[];
  stripeIncome?: number;
  stripeFees?: number; 
  stripeTransactionFees?: number;
  stripePayoutFees?: number;
  stripeAdditionalFees?: number;
  stripeNet?: number;
  stripeFeePercentage?: number;
  regularIncome?: number;
}

const FinanceSummary: React.FC<FinanceSummaryProps> = ({ 
  summary, 
  expenseCategories = [],
  stripeIncome = 0,
  stripeFees = 0,
  stripeTransactionFees = 0,
  stripePayoutFees = 0,
  stripeAdditionalFees = 0,
  stripeNet = 0,
  stripeFeePercentage = 0,
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

  // Calculate non-collaborator expenses
  const otherExpenses = summary.totalExpense - (summary.collaboratorExpense || 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Initial Balance Section */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">Balance Inicial</h2>
        <div className="grid grid-cols-1">
          <Card className="finance-card bg-white">
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
        </div>
      </div>

      {/* Income Sources Section with Tabs */}
      <div>
        <Tabs defaultValue="stripe" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Fuentes de Ingresos</h2>
            <TabsList>
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="zoho">Zoho</TabsTrigger>
              <TabsTrigger value="combined">Combinado</TabsTrigger>
            </TabsList>
          </div>

          {/* Stripe Income Tab */}
          <TabsContent value="stripe" className="p-0">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stripe Gross Income */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Stripe (Bruto)</h3>
                      <div className="p-2 bg-green-50 rounded-full">
                        <BadgeDollarSign className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-500 animate-value">
                      {formatCurrency(stripeIncome)}
                    </div>
                  </CardContent>
                </Card>

                {/* Stripe Net */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Stripe (Neto)</h3>
                      <div className="p-2 bg-green-50 rounded-full">
                        <BadgeDollarSign className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-500 animate-value">
                      {formatCurrency(stripeNet)}
                    </div>
                  </CardContent>
                </Card>

                {/* Total Stripe Fees */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Total Comisiones</h3>
                      <div className="p-2 bg-amber-50 rounded-full">
                        <Scissors className="h-4 w-4 text-amber-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-500 animate-value">
                      {formatCurrency(stripeFees)}
                      <div className="text-sm mt-1 text-gray-500">
                        {stripeFeePercentage > 0 && formatPercentage(stripeFeePercentage)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Breakdown Section */}
              <h4 className="text-md font-medium text-gray-600 mt-6 mb-4">Desglose de Comisiones</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Transaction Fees */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Comisiones (Transacción)</h3>
                      <div className="p-2 bg-amber-50 rounded-full">
                        <Scissors className="h-4 w-4 text-amber-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-500 animate-value">
                      {formatCurrency(stripeTransactionFees)}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Additional Fees */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Comisiones Adicionales</h3>
                      <div className="p-2 bg-amber-50 rounded-full">
                        <Scissors className="h-4 w-4 text-amber-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-500 animate-value">
                      {formatCurrency(stripeAdditionalFees)}
                      <div className="text-sm mt-1 text-gray-500">
                        {stripeAdditionalFees > 0 && `${stripeFeePercentage.toFixed(1)}% del total`}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payout Fees */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Comisiones (Payout)</h3>
                      <div className="p-2 bg-amber-50 rounded-full">
                        <Scissors className="h-4 w-4 text-amber-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-500 animate-value">
                      {formatCurrency(stripePayoutFees)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Zoho Income Tab */}
          <TabsContent value="zoho" className="p-0">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zoho Income */}
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
              </div>
            </div>
          </TabsContent>

          {/* Combined Financial Overview */}
          <TabsContent value="combined" className="p-0">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Income */}
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

                {/* Stripe Income */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Stripe (Neto)</h3>
                      <div className="p-2 bg-green-50 rounded-full">
                        <BadgeDollarSign className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-500 animate-value">
                      {formatCurrency(stripeNet)}
                    </div>
                  </CardContent>
                </Card>

                {/* Zoho Income */}
                <Card className="finance-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Zoho</h3>
                      <div className="p-2 bg-green-50 rounded-full">
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-500 animate-value">
                      {formatCurrency(regularIncome)}
                    </div>
                  </CardContent>
                </Card>

                {/* Total Expenses - NUEVA TARJETA */}
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Financial Summary Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Collaborator Expenses */}
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

          {/* Other Expenses - NUEVA TARJETA */}
          <Card className="finance-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Otros Gastos</h3>
                <div className="p-2 bg-red-50 rounded-full">
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-500 animate-value">
                {formatCurrency(otherExpenses)}
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
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
            </CardContent>
          </Card>

          {/* Gross Profit - NEW CARD */}
          <Card className="finance-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Beneficio Bruto</h3>
                <div className="p-2 bg-green-50 rounded-full">
                  <Calculator className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-green-500 animate-value">
                  {formatCurrency(summary.grossProfit)}
                </div>
                <div className={`text-sm font-medium ml-2 ${summary.grossProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Margen: {formatPercentage(summary.grossProfitMargin)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Profit - Separate Row */}
        <div className="mt-6 grid grid-cols-1 gap-6">
          <Card className="finance-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Beneficio Neto (incluye balance inicial)</h3>
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
              <div className="mt-2 text-xs text-gray-500">
                Balance Inicial + Ingresos Totales - Gastos Totales
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinanceSummary;
