import { Card, CardContent } from "@/components/ui/card";
import { Boxes, CheckCircle2, Clock, DollarSign, Tag } from "lucide-react";
import type { InventoryStats } from "../types";
import { formatMoney } from "../lib/inventory";

interface StatsCardsProps {
  stats: InventoryStats;
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      label: "Kits",
      value: String(stats.totalKits),
      icon: Boxes,
      tint: "text-blue-600",
    },
    {
      label: "Built",
      value: String(stats.built),
      icon: CheckCircle2,
      tint: "text-green-600",
    },
    {
      label: "Backlog",
      value: String(stats.backlog),
      icon: Clock,
      tint: "text-amber-600",
    },
    {
      label: "For sale",
      value: String(stats.forSale),
      icon: Tag,
      tint: "text-purple-600",
    },
    {
      label: "Total spent",
      value: formatMoney(stats.totalSpent),
      icon: DollarSign,
      tint: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <card.icon className={`h-5 w-5 shrink-0 ${card.tint}`} />
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {card.label}
              </p>
              <p className="truncate text-lg font-semibold">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
