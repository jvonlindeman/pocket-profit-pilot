import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Circle, Hammer, Plus, X } from "lucide-react";
import type { GunplaItem } from "../types";
import { BUILD_STAGES, stagesDone } from "../lib/inventory";

interface ProjectsPanelProps {
  items: GunplaItem[];
  onStartBuild: (code: string) => void;
  onToggleStage: (item: GunplaItem, stageKey: string) => void;
  onRemoveBuild: (code: string) => void;
}

const TOTAL = BUILD_STAGES.length;

const ProjectsPanel = ({
  items,
  onStartBuild,
  onToggleStage,
  onRemoveBuild,
}: ProjectsPanelProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Active builds are the kits currently "In Progress".
  const active = useMemo(
    () => items.filter((i) => i.status === "In Progress"),
    [items]
  );

  // Anything not already on the bench can be started.
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => i.status !== "In Progress")
      .filter((i) =>
        q ? `${i.name} ${i.code} ${i.grade}`.toLowerCase().includes(q) : true
      )
      .slice(0, 60);
  }, [items, search]);

  const startBuild = (code: string) => {
    onStartBuild(code);
    setPickerOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {active.length === 0
            ? "No active builds yet."
            : `${active.length} active build${active.length > 1 ? "s" : ""}`}
        </p>
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Start a build
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a build</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              placeholder="Search a kit by name, code, grade…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-80 overflow-y-auto rounded-md border">
              {candidates.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No kits found.
                </p>
              ) : (
                candidates.map((i) => (
                  <button
                    key={i.code}
                    type="button"
                    onClick={() => startBuild(i.code)}
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-mono text-xs text-muted-foreground">
                        {i.code}
                      </span>{" "}
                      {i.name}
                    </span>
                    <Badge variant="outline" className="shrink-0">
                      {i.grade}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {active.length === 0 ? (
        <div className="rounded-md border p-10 text-center text-sm text-muted-foreground">
          <Hammer className="mx-auto mb-2 h-6 w-6 opacity-50" />
          Pick a kit with “Start a build” to begin tracking its stages.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((item) => {
            const stages = item.stages ?? [];
            const done = stagesDone(stages);
            const pct = Math.round((done / TOTAL) * 100);
            const complete = done >= TOTAL;
            return (
              <Card key={item.code}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.code}
                        </span>
                        <Badge variant="outline">{item.grade}</Badge>
                      </div>
                      <p className="truncate font-medium">{item.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => onRemoveBuild(item.code)}
                      aria-label="Remove from builds"
                      title="Remove from builds"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {complete ? "Built 🎉" : `${done}/${TOTAL}`}
                    </span>
                  </div>

                  <ul className="space-y-0.5">
                    {BUILD_STAGES.map((stage) => {
                      const checked = stages.includes(stage.key);
                      return (
                        <li key={stage.key}>
                          <button
                            type="button"
                            onClick={() => onToggleStage(item, stage.key)}
                            className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-muted"
                          >
                            {checked ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span
                              className={
                                checked
                                  ? "text-muted-foreground line-through"
                                  : ""
                              }
                            >
                              {stage.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsPanel;
