import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Hammer,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import type { GunplaItem, InventoryStats } from "../types";
import {
  BUILD_STAGES,
  formatDate,
  formatMoney,
  lastPhotoOf,
  latestPhotos,
  PRIORITY_BADGE_CLASSES,
  recentlyCompleted,
  sortProjects,
  stagesDone,
  stagesSkipped,
} from "../lib/inventory";
import { photoUrl } from "../lib/api";
import BuildProgress from "./BuildProgress";

const TOTAL = BUILD_STAGES.length;

interface BenchDashboardProps {
  items: GunplaItem[];
  stats: InventoryStats;
  onGoToProjects: () => void;
  onAddKit: () => void;
}

const BenchDashboard = ({
  items,
  stats,
  onGoToProjects,
  onAddKit,
}: BenchDashboardProps) => {
  const active = useMemo(
    () => sortProjects(items.filter((i) => i.status === "In Progress")),
    [items]
  );
  const photos = useMemo(() => latestPhotos(items, 8), [items]);
  const completed = useMemo(() => recentlyCompleted(items, 4), [items]);

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          On the bench
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onGoToProjects}>
            <Hammer className="mr-1.5 h-4 w-4" />
            Start a build
          </Button>
          <Button size="sm" onClick={onAddKit}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add kit
          </Button>
        </div>
      </div>

      {/* Active builds */}
      {active.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          <Hammer className="mx-auto mb-2 h-6 w-6 opacity-50" />
          Nothing on the bench — start a build to see it here.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((item) => {
            const done = stagesDone(item.stages);
            const applicable = TOTAL - stagesSkipped(item.skippedStages);
            const pct = Math.round((done / Math.max(1, applicable)) * 100);
            const thumb = lastPhotoOf(item);
            return (
              <button
                key={item.code}
                type="button"
                onClick={onGoToProjects}
                className="text-left"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex gap-3 p-3">
                    {thumb ? (
                      <img
                        src={photoUrl(thumb)}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.code}
                        </span>
                        {item.priority && (
                          <Badge
                            variant="outline"
                            className={`${PRIORITY_BADGE_CLASSES[item.priority]} px-1.5 py-0 text-[10px]`}
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {done}/{applicable}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Collection snapshot */}
        <div className="space-y-2">
          <BuildProgress stats={stats} scopeLabel="Whole collection" />
          <p className="px-1 text-xs text-muted-foreground">
            {stats.totalKits} kits · {formatMoney(stats.totalSpent)} invested
          </p>
        </div>

        {/* Recently completed */}
        <Card>
          <CardContent className="space-y-2 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              Recently completed
            </h3>
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Finished builds with a finish date will show up here.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {completed.map((item) => (
                  <li
                    key={item.code}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.code}
                      </span>{" "}
                      {item.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">{item.grade}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.finishedAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest photos */}
      {photos.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Latest photos
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p) => (
                <button
                  key={p.filename}
                  type="button"
                  onClick={onGoToProjects}
                  className="shrink-0"
                  title={p.name}
                >
                  <img
                    src={photoUrl(p.filename)}
                    alt={p.name}
                    className="h-24 w-24 rounded-md border object-cover"
                  />
                  <span className="mt-0.5 block text-center font-mono text-[10px] text-muted-foreground">
                    {p.code}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BenchDashboard;
