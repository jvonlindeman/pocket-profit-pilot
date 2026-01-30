import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUp, ArrowDown } from 'lucide-react';
import { YearToDateMetrics } from './types';

interface YTDKPICardsProps {
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

export const YTDKPICards: React.FC<YTDKPICardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(metrics.totalIncome),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      subtitle: `Stripe: ${formatPercent(metrics.stripePercentage)} | Zoho: ${formatPercent(metrics.zohoPercentage)}`
    },
    {
      title: 'Gastos Totales',
      value: formatCurrency(metrics.totalExpense),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      subtitle: `Promedio: ${formatCurrency(metrics.averageMonthlyExpense)}/mes`
    },
    {
      title: 'Profit YTD',
      value: formatCurrency(metrics.totalProfit),
      icon: metrics.totalProfit >= 0 ? TrendingUp : TrendingDown,
      color: metrics.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: metrics.totalProfit >= 0 ? 'bg-blue-50' : 'bg-red-50',
      borderColor: metrics.totalProfit >= 0 ? 'border-blue-200' : 'border-red-200',
      subtitle: metrics.momGrowth !== 0 
        ? `${metrics.momGrowth > 0 ? '↑' : '↓'} ${Math.abs(metrics.momGrowth).toFixed(1)}% vs mes anterior`
        : 'Sin comparación disponible'
    },
    {
      title: 'Margen de Profit',
      value: formatPercent(metrics.profitMargin),
      icon: Percent,
      color: metrics.profitMargin >= 20 ? 'text-emerald-600' : metrics.profitMargin >= 10 ? 'text-amber-600' : 'text-red-600',
      bgColor: metrics.profitMargin >= 20 ? 'bg-emerald-50' : metrics.profitMargin >= 10 ? 'bg-amber-50' : 'bg-red-50',
      borderColor: metrics.profitMargin >= 20 ? 'border-emerald-200' : metrics.profitMargin >= 10 ? 'border-amber-200' : 'border-red-200',
      subtitle: metrics.profitMargin >= 20 ? 'Saludable' : metrics.profitMargin >= 10 ? 'Moderado' : 'Bajo'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.bgColor} ${card.borderColor} border`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
