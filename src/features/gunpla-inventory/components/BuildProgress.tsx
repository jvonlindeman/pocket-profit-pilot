import { Card, CardContent } from "@/components/ui/card";
import type { InventoryStats } from "../types";

interface BuildProgressProps {
  stats: InventoryStats;
  /** e.g. "Whole collection" or "Filtered · 15 kits". */
  scopeLabel: string;
}

const BuildProgress = ({ stats, scopeLabel }: BuildProgressProps) => {
  const { totalKits, built, backlog } = stats;
  const other = Math.max(0, totalKits - built - backlog);
  const pct = (n: number) => (totalKits ? (n / totalKits) * 100 : 0);
  const builtPct = Math.round(pct(built));

  const segments = [
    { label: "Built", value: built, color: "bg-green-500" },
    { label: "Backlog", value: backlog, color: "bg-amber-500" },
    { label: "Other", value: other, color: "bg-muted-foreground/40" },
  ].filter((s) => s.value > 0);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">Build progress</h2>
            <span className="text-xs text-muted-foreground">{scopeLabel}</span>
          </div>
          <span className="text-sm font-semibold">
            {builtPct}% built
            <span className="ml-1 font-normal text-muted-foreground">
              ({built}/{totalKits})
            </span>
          </span>
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {segments.map((s) => (
            <div
              key={s.label}
              className={s.color}
              style={{ width: `${pct(s.value)}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {segments.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${s.color}`}
              />
              {s.label} {s.value}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildProgress;
