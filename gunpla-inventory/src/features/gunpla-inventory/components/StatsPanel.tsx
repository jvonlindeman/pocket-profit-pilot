import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Breakdown } from "../types";
import { formatMoney } from "../lib/inventory";

interface BreakdownCardProps {
  title: string;
  rows: Breakdown[];
  /** Show the built/backlog split under each bar. */
  showStatusSplit?: boolean;
}

const BreakdownCard = ({ title, rows, showStatusSplit }: BreakdownCardProps) => {
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {rows.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[360px] space-y-3 overflow-y-auto">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No data.</p>
        )}
        {rows.map((row) => (
          <div key={row.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium">{row.key}</span>
              <span className="shrink-0 text-muted-foreground">
                {row.count} · {formatMoney(row.spent)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(row.count / maxCount) * 100}%` }}
              />
            </div>
            {showStatusSplit && (
              <p className="text-[11px] text-muted-foreground">
                {row.built} built · {row.backlog} backlog
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

interface StatsPanelProps {
  byGrade: Breakdown[];
  byStatus: Breakdown[];
  byLocation: Breakdown[];
  bySource: Breakdown[];
}

const StatsPanel = ({
  byGrade,
  byStatus,
  byLocation,
  bySource,
}: StatsPanelProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <BreakdownCard title="By grade" rows={byGrade} showStatusSplit />
      <BreakdownCard title="By status" rows={byStatus} />
      <BreakdownCard title="By location" rows={byLocation} showStatusSplit />
      <BreakdownCard title="By source" rows={bySource} />
    </div>
  );
};

export default StatsPanel;
