import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, Loader2, Plus, RotateCcw } from "lucide-react";

import type {
  BuildPriority,
  GunplaItem,
  InventoryFilters,
  Paint,
} from "./types";
import { useGunplaInventory } from "./hooks/useGunplaInventory";
import { usePaintStash } from "./hooks/usePaintStash";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { deletePhotoApi } from "./lib/api";
import {
  computeStats,
  deriveStatus,
  distinctValues,
  filterItems,
  groupBy,
  sortItems,
  type SortKey,
  type SortState,
} from "./lib/inventory";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import ThemeToggle from "./components/ThemeToggle";
import StatsCards from "./components/StatsCards";
import ProjectsPanel from "./components/ProjectsPanel";
import BenchDashboard from "./components/BenchDashboard";
import PaintStashPanel from "./components/PaintStashPanel";
import BuildProgress from "./components/BuildProgress";
import StatsPanel from "./components/StatsPanel";
import FilterBar from "./components/FilterBar";
import InventoryTable from "./components/InventoryTable";
import ItemFormDialog from "./components/ItemFormDialog";
import ExportMenu from "./components/ExportMenu";

const EMPTY_FILTERS: InventoryFilters = {
  search: "",
  grade: "",
  brand: "",
  status: "",
  location: "",
  sellOnly: false,
};

const GunplaInventoryPage = () => {
  const { items, loading, online, upsertItem, removeItem, reset, codes } =
    useGunplaInventory();
  const paintStash = usePaintStash();
  const { version, serverChanged, updateAvailable } = useVersionCheck(
    online && !loading
  );

  const [tab, setTab] = useState("bench");
  const [filters, setFilters] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GunplaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GunplaItem | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: "code", dir: "asc" });

  const grades = useMemo(() => distinctValues(items, "grade"), [items]);
  const brands = useMemo(() => distinctValues(items, "brand"), [items]);
  const statuses = useMemo(() => distinctValues(items, "status"), [items]);
  const locations = useMemo(() => distinctValues(items, "location"), [items]);

  const filtered = useMemo(
    () => filterItems(items, filters),
    [items, filters]
  );
  const sorted = useMemo(() => sortItems(filtered, sort), [filtered, sort]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const totalStats = useMemo(() => computeStats(items), [items]);
  const isFiltered = filtered.length !== items.length;
  const byGrade = useMemo(() => groupBy(filtered, "grade"), [filtered]);
  const byStatus = useMemo(() => groupBy(filtered, "status"), [filtered]);
  const byLocation = useMemo(() => groupBy(filtered, "location"), [filtered]);
  const bySource = useMemo(() => groupBy(filtered, "source"), [filtered]);

  const patchFilters = (patch: Partial<InventoryFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const handleAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: GunplaItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleSave = async (item: GunplaItem) => {
    const isNew = !codes.has(item.code);
    try {
      await upsertItem(item);
      toast.success(isNew ? `Added ${item.code}` : `Updated ${item.code}`);
    } catch (err) {
      toast.error(`Could not save ${item.code}: ${(err as Error).message}`);
    }
  };

  // --- Projects tab: build-stage tracking -------------------------------------
  const persistQuiet = async (item: GunplaItem, successMsg?: string) => {
    try {
      await upsertItem(item);
      if (successMsg) toast.success(successMsg);
    } catch (err) {
      toast.error(`Could not save ${item.code}: ${(err as Error).message}`);
    }
  };

  const handleStartBuild = (code: string) => {
    const item = items.find((i) => i.code === code);
    if (!item) return;
    persistQuiet({ ...item, status: "In Progress" }, `Started build: ${item.code}`);
  };

  const handleToggleStage = (item: GunplaItem, stageKey: string) => {
    const current = item.stages ?? [];
    const next = current.includes(stageKey)
      ? current.filter((s) => s !== stageKey)
      : [...current, stageKey];
    const status = deriveStatus(next);
    persistQuiet(
      { ...item, stages: next, status },
      status === "Built" ? `${item.code} built! 🎉` : undefined
    );
  };

  const handleRemoveBuild = (code: string) => {
    const item = items.find((i) => i.code === code);
    if (!item) return;
    persistQuiet({ ...item, status: "Backlog" }, `Removed ${item.code} from builds`);
  };

  const handleAddPhoto = (item: GunplaItem, filename: string) => {
    persistQuiet({ ...item, photos: [...(item.photos ?? []), filename] });
  };

  const handleRemovePhoto = (item: GunplaItem, filename: string) => {
    persistQuiet({
      ...item,
      photos: (item.photos ?? []).filter((p) => p !== filename),
    });
    deletePhotoApi(filename).catch(() => {
      /* file may already be gone; the array update is what matters */
    });
  };

  const handleSaveStageNote = (
    item: GunplaItem,
    stageKey: string,
    note: string
  ) => {
    const notes = { ...(item.stageNotes ?? {}) };
    if (note.trim()) notes[stageKey] = note.trim();
    else delete notes[stageKey];
    persistQuiet({ ...item, stageNotes: notes });
  };

  const handleSavePaints = (item: GunplaItem, paints: Paint[]) => {
    persistQuiet({ ...item, paints });
  };

  const handleSaveInfo = (
    item: GunplaItem,
    info: {
      startedAt: string | null;
      finishedAt: string | null;
      priority: BuildPriority | null;
    }
  ) => {
    persistQuiet({ ...item, ...info });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { code } = pendingDelete;
    setPendingDelete(null);
    try {
      await removeItem(code);
      toast.success(`Deleted ${code}`);
    } catch (err) {
      toast.error(`Could not delete ${code}: ${(err as Error).message}`);
    }
  };

  const handleReset = async () => {
    setResetOpen(false);
    try {
      await reset();
      setFilters(EMPTY_FILTERS);
      toast.success("Inventory reset to the original sheet data");
    } catch (err) {
      toast.error(`Could not reset: ${(err as Error).message}`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Gunpla Inventory
            </h1>
            {!loading &&
              (online ? (
                <Badge variant="success" className="gap-1">
                  <Database className="h-3 w-3" />
                  Local file
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <HardDrive className="h-3 w-3" />
                  Browser only
                </Badge>
              ))}
            {version && (
              <span className="font-mono text-xs text-muted-foreground">
                v {version}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {items.length} kits ·{" "}
            {filtered.length === items.length
              ? "showing all"
              : `${filtered.length} matching`}
          </p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <ExportMenu items={sorted} />
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add kit
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-md border p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading inventory…
        </div>
      ) : (
        <>
          {!online && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Local server not detected — running on browser storage, so changes
              won&apos;t be written to your{" "}
              <code className="font-mono">~/Documents/Gunpla Inventory</code>{" "}
              file. Re-open <code className="font-mono">start.command</code> and
              reload this page.
            </p>
          )}

          {serverChanged ? (
            <p className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <span>
                The app was updated behind this window — reload to get the
                latest version.
              </span>
              <Button size="sm" onClick={() => location.reload()}>
                Reload
              </Button>
            </p>
          ) : updateAvailable ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              A new version is ready — quit and reopen the app icon to update.
            </p>
          ) : null}

          {tab !== "bench" && (
            <>
              <StatsCards
                total={totalStats}
                filtered={stats}
                isFiltered={isFiltered}
              />

              <BuildProgress
                stats={stats}
                scopeLabel={
                  isFiltered
                    ? `Filtered · ${stats.totalKits} kits`
                    : "Whole collection"
                }
              />

              <FilterBar
                filters={filters}
                grades={grades}
                brands={brands}
                statuses={statuses}
                locations={locations}
                onChange={patchFilters}
                onClear={() => setFilters(EMPTY_FILTERS)}
              />
            </>
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="bench">Bench</TabsTrigger>
              <TabsTrigger value="list">Kits</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="paints">Paints</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            <TabsContent value="bench" className="mt-4">
              <BenchDashboard
                items={items}
                stats={totalStats}
                onGoToProjects={() => setTab("projects")}
                onAddKit={handleAdd}
              />
            </TabsContent>
            <TabsContent value="list" className="mt-4">
              <InventoryTable
                items={sorted}
                sort={sort}
                onSort={toggleSort}
                onEdit={handleEdit}
                onInlineSave={handleSave}
                onDelete={setPendingDelete}
              />
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
              <ProjectsPanel
                items={items}
                online={online}
                onStartBuild={handleStartBuild}
                onToggleStage={handleToggleStage}
                onRemoveBuild={handleRemoveBuild}
                onAddPhoto={handleAddPhoto}
                onRemovePhoto={handleRemovePhoto}
                onSaveStageNote={handleSaveStageNote}
                onSavePaints={handleSavePaints}
                onSaveInfo={handleSaveInfo}
              />
            </TabsContent>
            <TabsContent value="paints" className="mt-4">
              <PaintStashPanel
                items={items}
                paints={paintStash.paints}
                loading={paintStash.loading}
                onAdd={paintStash.addPaint}
                onUpdate={paintStash.updatePaint}
                onRemove={paintStash.removePaint}
              />
            </TabsContent>
            <TabsContent value="stats" className="mt-4">
              <StatsPanel
                byGrade={byGrade}
                byStatus={byStatus}
                byLocation={byLocation}
                bySource={bySource}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        items={items}
        onSave={handleSave}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete kit?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} ({pendingDelete?.code}) will be removed from
              your inventory. This only affects this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset inventory?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores the original kits from the sheet and discards any
              local changes you made in this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GunplaInventoryPage;
