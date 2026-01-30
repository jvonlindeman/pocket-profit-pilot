import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { useYearToDateSummary } from '@/hooks/useYearToDateSummary';
import { YTDKPICards } from './YTDKPICards';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { YearInsights } from './YearInsights';
import { YearToDateSummaryProps } from './types';

export const YearToDateSummary: React.FC<YearToDateSummaryProps> = ({
  transactions,
  stripeData,
  zohoIncome,
  totalZohoExpenses,
  collaboratorExpenses
}) => {
  const metrics = useYearToDateSummary({
    transactions,
    stripeIncome: stripeData.income,
    stripeFees: stripeData.fees,
    stripeNet: stripeData.net,
    zohoIncome,
    totalZohoExpenses
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            📊 Resumen Anual {currentYear}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <YTDKPICards metrics={metrics} />

      {/* Monthly Trend Chart */}
      <MonthlyTrendChart monthlyBreakdown={metrics.monthlyBreakdown} />

      {/* Insights */}
      <YearInsights metrics={metrics} />
    </div>
  );
};

export default YearToDateSummary;
