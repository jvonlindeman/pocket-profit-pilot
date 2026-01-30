import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, AlertTriangle, Calculator, TrendingUp, CreditCard, FileText } from 'lucide-react';
import { YearToDateMetrics } from './types';

interface YearInsightsProps {
  metrics: YearToDateMetrics;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export const YearInsights: React.FC<YearInsightsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Best Month */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-600" />
            Mejor Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.bestMonth ? (
            <>
              <p className="text-2xl font-bold text-emerald-700">{metrics.bestMonth.month}</p>
              <p className="text-sm text-emerald-600">
                Profit: {formatCurrency(metrics.bestMonth.profit)}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Worst Month */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Mes Más Bajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.worstMonth ? (
            <>
              <p className="text-2xl font-bold text-amber-700">{metrics.worstMonth.month}</p>
              <p className="text-sm text-amber-600">
                Profit: {formatCurrency(metrics.worstMonth.profit)}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Average */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            Promedios Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ingresos:</span>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              {formatCurrency(metrics.averageMonthlyIncome)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gastos:</span>
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {formatCurrency(metrics.averageMonthlyExpense)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Income Sources */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Desglose de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Stripe</span>
                <Badge variant="outline">{formatPercent(metrics.stripePercentage)}</Badge>
              </div>
              <p className="text-lg font-semibold text-purple-700">{formatCurrency(metrics.stripeNet)}</p>
              <p className="text-xs text-muted-foreground">
                Gross: {formatCurrency(metrics.stripeIncome)} | Fees: {formatCurrency(metrics.stripeFees)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Zoho</span>
                <Badge variant="outline">{formatPercent(metrics.zohoPercentage)}</Badge>
              </div>
              <p className="text-lg font-semibold text-blue-700">{formatCurrency(metrics.zohoIncome)}</p>
              <p className="text-xs text-muted-foreground">
                Facturas y pagos directos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Indicator */}
      <Card className={metrics.momGrowth >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${metrics.momGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            Tendencia MoM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${metrics.momGrowth >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {metrics.momGrowth >= 0 ? '+' : ''}{formatPercent(metrics.momGrowth)}
          </p>
          <p className={`text-sm ${metrics.momGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {metrics.momGrowth >= 0 ? 'Crecimiento vs mes anterior' : 'Contracción vs mes anterior'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
