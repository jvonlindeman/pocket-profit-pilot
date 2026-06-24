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

import type { GunplaItem, InventoryFilters } from "./types";
import { useGunplaInventory } from "./hooks/useGunplaInventory";
import {
  computeStats,
  distinctValues,
  filterItems,
  nextCode,
} from "./lib/inventory";
import StatsCards from "./components/StatsCards";
import FilterBar from "./components/FilterBar";
import InventoryTable from "./components/InventoryTable";
import ItemFormDialog from "./components/ItemFormDialog";

const EMPTY_FILTERS: InventoryFilters = {
  search: "",
  grade: "",
  status: "",
  location: "",
  sellOnly: false,
};

const GunplaInventoryPage = () => {
  const { items, loading, online, upsertItem, removeItem, reset, codes } =
    useGunplaInventory();

  const [filters, setFilters] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GunplaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GunplaItem | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const grades = useMemo(() => distinctValues(items, "grade"), [items]);
  const statuses = useMemo(() => distinctValues(items, "status"), [items]);
  const locations = useMemo(() => distinctValues(items, "location"), [items]);

  const filtered = useMemo(
    () => filterItems(items, filters),
    [items, filters]
  );
  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const suggestedCode = useMemo(
    () => nextCode(items, filters.grade || "HG"),
    [items, filters.grade]
  );

  const patchFilters = (patch: Partial<InventoryFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

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
                  Local DB
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <HardDrive className="h-3 w-3" />
                  Browser only
                </Badge>
              ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {items.length} kits ·{" "}
            {filtered.length === items.length
              ? "showing all"
              : `${filtered.length} matching`}
          </p>
        </div>
        <div className="flex gap-2">
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
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Local database not detected — running on browser storage. Start it
              with{" "}
              <code className="font-mono">cd server &amp;&amp; npm start</code>{" "}
              and reload to use SQLite.
            </p>
          )}

          <StatsCards stats={stats} />

          <FilterBar
            filters={filters}
            grades={grades}
            statuses={statuses}
            locations={locations}
            onChange={patchFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
          />

          <InventoryTable
            items={filtered}
            onEdit={handleEdit}
            onDelete={setPendingDelete}
          />
        </>
      )}

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        suggestedCode={suggestedCode}
        existingCodes={codes}
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
