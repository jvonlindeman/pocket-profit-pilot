
import React, { useEffect } from 'react';
import { FinancialSummary } from '@/types/financial';
import { ArrowDownIcon, Users, Calculator, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import SummaryCard from './SummaryCard';

interface FinancialSummarySectionProps {
  summary: FinancialSummary;
  otherExpenses: number;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

const FinancialSummarySection: React.FC<FinancialSummarySectionProps> = ({
  summary,
  otherExpenses,
  formatCurrency,
  formatPercentage
}) => {
  // Add debug logging for collaborator expenses
  useEffect(() => {
    console.log("FinancialSummarySection receiving data:", {
      collaboratorExpense: summary.collaboratorExpense || 0,
      otherExpenses,
      totalExpense: summary.totalExpense
    });
  }, [summary, otherExpenses]);

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen Financiero</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Collaborator Expenses */}
        <SummaryCard
          title="Gastos Colaboradores"
          value={formatCurrency(summary.collaboratorExpense || 0)}
          icon={Users}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />

        {/* Other Expenses */}
        <SummaryCard
          title="Otros Gastos"
          value={formatCurrency(otherExpenses)}
          icon={ArrowDownIcon}
          iconColor="text-red-500"
          iconBgColor="bg-red-50"
        />

        {/* Total Expenses */}
        <SummaryCard
          title="Gastos Totales"
          value={formatCurrency(summary.totalExpense)}
          icon={ArrowDownIcon}
          iconColor="text-red-500"
          iconBgColor="bg-red-50"
        />

        {/* Gross Profit */}
        <SummaryCard
          title="Beneficio Bruto"
          value={formatCurrency(summary.grossProfit)}
          icon={Calculator}
          iconColor="text-green-500"
          iconBgColor="bg-green-50"
          additionalContent={
            <div className={`text-sm font-medium ml-2 ${summary.grossProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Margen: {formatPercentage(summary.grossProfitMargin)}
            </div>
          }
        />
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
  );
};

export default FinancialSummarySection;
