import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, TrendingDown, Percent, ArrowUpRight, CreditCard, Wallet } from "lucide-react";
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
      subtitle: metrics.stripeClientsCount > 0 ? `${metrics.stripeClientsCount} con Stripe` : undefined,
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
      title: "Fees Stripe",
      value: formatCurrency(metrics.totalStripeFees),
      subtitle: metrics.hasRealData ? "Datos reales" : "Sin datos",
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      showBadge: metrics.hasRealData,
    },
    {
      title: "OPEX + Gastos",
      value: formatCurrency(metrics.totalOpex + metrics.totalZohoExpenses),
      subtitle: metrics.hasRealData 
        ? `OPEX: ${formatCurrency(metrics.totalOpex)} + Zoho: ${formatCurrency(metrics.totalZohoExpenses)}`
        : undefined,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Profit Real",
      value: formatCurrency(metrics.totalRealProfit),
      subtitle: formatPercent(metrics.realMarginPercent) + " margen",
      icon: Wallet,
      color: metrics.totalRealProfit >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: metrics.totalRealProfit >= 0 ? "bg-emerald-50" : "bg-red-50",
      showBadge: metrics.hasRealData,
    },
    {
      title: "Expansion MRR",
      value: formatCurrency(metrics.totalUpsellRevenue),
      subtitle: metrics.clientsWithUpsells > 0 
        ? `${metrics.clientsWithUpsells} cliente${metrics.clientsWithUpsells > 1 ? 's' : ''} (${formatPercent(metrics.expansionRate)})`
        : undefined,
      icon: ArrowUpRight,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-2">
      {/* Real data indicator */}
      <div className="flex items-center gap-2">
        {metrics.hasRealData ? (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            ✓ Datos financieros reales
          </Badge>
        ) : (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
            ⚠ Carga el dashboard financiero para ver datos reales
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{card.title}</p>
                  <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
                  {card.subtitle && (
                    <p className={`text-xs font-medium mt-0.5 ${card.color} truncate`}>{card.subtitle}</p>
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
    </div>
  );
};
