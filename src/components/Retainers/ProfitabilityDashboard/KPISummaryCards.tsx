import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, DollarSign, TrendingDown, ArrowUpRight, CreditCard, Wallet, AlertCircle } from "lucide-react";
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
    <div className="space-y-4">
      {/* Real data indicator */}
      {!metrics.hasRealData && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Para ver datos reales de Stripe y Zoho, primero carga el{" "}
            <a href="/" className="underline font-medium hover:text-amber-900">Dashboard Financiero</a>
          </AlertDescription>
        </Alert>
      )}
      
      {metrics.hasRealData && (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
          ✓ Datos financieros reales
        </Badge>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-lg font-bold mt-1">{card.value}</p>
                  {card.subtitle && (
                    <p className={`text-xs font-medium mt-0.5 ${card.color} line-clamp-2`}>{card.subtitle}</p>
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
