import { Card, CardContent } from "@/components/ui/card";
import { Boxes, CheckCircle2, Clock, DollarSign, Tag } from "lucide-react";
import type { InventoryStats } from "../types";
import { formatMoney } from "../lib/inventory";

interface StatsCardsProps {
  /** Whole-collection totals (always shown as the primary number). */
  total: InventoryStats;
  /** Totals over the currently filtered set. */
  filtered: InventoryStats;
  /** True when a filter is narrowing the list. */
  isFiltered: boolean;
}

interface CardDef {
  label: string;
  icon: typeof Boxes;
  tint: string;
  get: (s: InventoryStats) => string;
}

const CARDS: CardDef[] = [
  {
    label: "Kits",
    icon: Boxes,
    tint: "text-blue-600",
    get: (s) => String(s.totalKits),
  },
  {
    label: "Built",
    icon: CheckCircle2,
    tint: "text-green-600",
    get: (s) => String(s.built),
  },
  {
    label: "Backlog",
    icon: Clock,
    tint: "text-amber-600",
    get: (s) => String(s.backlog),
  },
  {
    label: "For sale",
    icon: Tag,
    tint: "text-purple-600",
    get: (s) => String(s.forSale),
  },
  {
    label: "Total spent",
    icon: DollarSign,
    tint: "text-emerald-600",
    get: (s) => formatMoney(s.totalSpent),
  },
];

const StatsCards = ({ total, filtered, isFiltered }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <card.icon className={`h-5 w-5 shrink-0 ${card.tint}`} />
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {card.label}
              </p>
              <p className="truncate text-lg font-semibold">
                {card.get(total)}
              </p>
              {isFiltered && (
                <p className="truncate text-xs text-muted-foreground">
                  {card.get(filtered)} filtered
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
