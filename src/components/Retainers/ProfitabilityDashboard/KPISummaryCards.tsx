import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";
import type { ProfitabilityMetrics } from "@/hooks/useProfitabilityMetrics";

interface KPISummaryCardsProps {
  metrics: ProfitabilityMetrics;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatPercent = (n: number) =>
  new Intl.NumberFormat("es-PA", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 100);

export const KPISummaryCards: React.FC<KPISummaryCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: "Clientes Activos",
      value: metrics.totalClients.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Ingreso Total",
      value: formatCurrency(metrics.totalIncome),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Gastos Totales",
      value: formatCurrency(metrics.totalExpenses),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Margen Promedio",
      value: formatPercent(metrics.averageMarginPercent),
      icon: Percent,
      color: metrics.averageMarginPercent >= 50 ? "text-green-600" : metrics.averageMarginPercent >= 20 ? "text-yellow-600" : "text-red-600",
      bgColor: metrics.averageMarginPercent >= 50 ? "bg-green-50" : metrics.averageMarginPercent >= 20 ? "bg-yellow-50" : "bg-red-50",
    },
    {
      title: "Más Rentable",
      value: metrics.topClient?.clientName ?? "—",
      subtitle: metrics.topClient ? formatPercent(metrics.topClient.marginPercent) : undefined,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">{card.title}</p>
                <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
                {card.subtitle && (
                  <p className={`text-sm font-medium mt-0.5 ${card.color}`}>{card.subtitle}</p>
                )}
              </div>
              <div className={`${card.bgColor} p-2 rounded-lg shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
