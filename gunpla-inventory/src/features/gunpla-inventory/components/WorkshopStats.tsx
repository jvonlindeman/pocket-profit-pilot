import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";
import type { GunplaItem } from "../types";
import { avgBuildDays, finishedByMonth } from "../lib/inventory";

interface WorkshopStatsProps {
  items: GunplaItem[];
}

/**
 * Workshop pace: builds finished per month (last 12) + averages, computed from
 * the finish dates the Projects flow stamps automatically. Kits marked Built
 * before dates existed simply aren't counted here.
 */
const WorkshopStats = ({ items }: WorkshopStatsProps) => {
  const months = useMemo(() => finishedByMonth(items, 12), [items]);
  const avgDays = useMemo(() => avgBuildDays(items), [items]);
  const total12 = months.reduce((a, m) => a + m.count, 0);
  const max = Math.max(1, ...months.map((m) => m.count));

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Hammer className="h-4 w-4 text-muted-foreground" />
            Workshop pace
          </h3>
          <p className="text-xs text-muted-foreground">
            {total12} finished in the last 12 months
            {avgDays != null && ` · avg ${Math.round(avgDays)} days per build`}
          </p>
        </div>

        <div className="flex items-end gap-1.5" style={{ height: 72 }}>
          {months.map((m) => (
            <div
              key={m.month}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${m.label}: ${m.count}`}
            >
              {m.count > 0 && (
                <span className="text-[10px] leading-none text-muted-foreground">
                  {m.count}
                </span>
              )}
              <div
                className="w-full rounded-t bg-green-500/80"
                style={{ height: `${(m.count / max) * 48}px` }}
              />
              <span className="text-[9px] leading-none text-muted-foreground">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {total12 === 0 && (
          <p className="text-xs text-muted-foreground">
            Completa builds en la pestaña Projects y aquí verás tu ritmo mes a
            mes.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkshopStats;
