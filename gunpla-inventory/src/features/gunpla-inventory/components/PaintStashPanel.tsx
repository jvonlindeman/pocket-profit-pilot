import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  Droplets,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import type { GunplaItem, PaintStatus, StashPaint } from "../types";
import { buildShoppingList, PAINT_TYPE_SUGGESTIONS } from "../lib/paints";

const STATUS_META: Record<PaintStatus, { label: string; className: string }> = {
  ok: {
    label: "OK",
    className:
      "border-green-300 text-green-700 dark:border-green-800 dark:text-green-300",
  },
  low: {
    label: "Low",
    className:
      "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300",
  },
  out: {
    label: "Out",
    className: "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300",
  },
};

type DraftPaint = Omit<StashPaint, "id">;
const EMPTY_DRAFT: DraftPaint = {
  brand: "",
  code: "",
  name: "",
  type: "",
  status: "ok",
};

interface PaintStashPanelProps {
  items: GunplaItem[];
  paints: StashPaint[];
  loading: boolean;
  onAdd: (p: DraftPaint) => void;
  onUpdate: (p: StashPaint) => void;
  onRemove: (id: string) => void;
}

function PaintFields({
  value,
  onChange,
  idPrefix,
}: {
  value: DraftPaint;
  onChange: (patch: Partial<DraftPaint>) => void;
  idPrefix: string;
}) {
  return (
    <>
      <TableCell className="p-2">
        <Input
          id={`${idPrefix}-brand`}
          className="h-8"
          placeholder="Tamiya"
          value={value.brand}
          onChange={(e) => onChange({ brand: e.target.value })}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          className="h-8"
          placeholder="X-7"
          value={value.code}
          onChange={(e) => onChange({ code: e.target.value })}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          className="h-8"
          placeholder="Red gloss"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          className="h-8"
          placeholder="Acrylic"
          list="paint-type-suggestions"
          value={value.type}
          onChange={(e) => onChange({ type: e.target.value })}
        />
      </TableCell>
      <TableCell className="p-2">
        <Select
          value={value.status}
          onValueChange={(v) => onChange({ status: v as PaintStatus })}
        >
          <SelectTrigger className="h-8 w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_META) as PaintStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </>
  );
}

const PaintStashPanel = ({
  items,
  paints,
  loading,
  onAdd,
  onUpdate,
  onRemove,
}: PaintStashPanelProps) => {
  const [draft, setDraft] = useState<DraftPaint>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftPaint>(EMPTY_DRAFT);

  const shopping = useMemo(
    () => buildShoppingList(items, paints),
    [items, paints]
  );

  const canAdd = !!(draft.brand.trim() || draft.code.trim() || draft.name.trim());

  const submitAdd = () => {
    if (!canAdd) return;
    onAdd({
      brand: draft.brand.trim(),
      code: draft.code.trim(),
      name: draft.name.trim(),
      type: draft.type.trim(),
      status: draft.status,
    });
    setDraft(EMPTY_DRAFT);
  };

  const startEdit = (p: StashPaint) => {
    setEditingId(p.id);
    setEditDraft({ ...p });
  };
  const submitEdit = () => {
    if (!editingId) return;
    onUpdate({ ...editDraft, id: editingId });
    setEditingId(null);
  };

  const prefillFromShopping = (paintText: string) => {
    setDraft({ ...EMPTY_DRAFT, name: paintText, status: "out" });
    const el = document.getElementById("add-brand");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Shared suggestions for the free-text type field */}
      <datalist id="paint-type-suggestions">
        {PAINT_TYPE_SUGGESTIONS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {/* Shopping list */}
      <Card>
        <CardContent className="space-y-2 p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            Shopping list
            <span className="font-normal text-muted-foreground">
              — recipe paints your active builds need that aren't in your stash
            </span>
          </h3>
          {shopping.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All recipe paints for your active builds are covered. 🎉
            </p>
          ) : (
            <ul className="space-y-1.5">
              {shopping.map((row) => (
                <li
                  key={row.paintText}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    {row.paintText}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {row.kits.map((code) => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="font-mono text-[10px]"
                      >
                        {code}
                      </Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => prefillFromShopping(row.paintText)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add to stash
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Stash table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[130px]">Type</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[90px] text-right">
                <span className="flex items-center justify-end gap-1">
                  <Droplets className="h-3.5 w-3.5" />
                  {paints.length}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add row */}
            <TableRow className="bg-muted/30">
              <PaintFields
                idPrefix="add"
                value={draft}
                onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              />
              <TableCell className="p-2 text-right">
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!canAdd}
                  onClick={submitAdd}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </TableCell>
            </TableRow>

            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="p-6 text-center text-sm text-muted-foreground"
                >
                  Loading stash…
                </TableCell>
              </TableRow>
            ) : paints.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="p-6 text-center text-sm text-muted-foreground"
                >
                  Your paint stash is empty — add the paints you own above.
                </TableCell>
              </TableRow>
            ) : (
              paints.map((p) =>
                editingId === p.id ? (
                  <TableRow key={p.id}>
                    <PaintFields
                      idPrefix={`edit-${p.id}`}
                      value={editDraft}
                      onChange={(patch) =>
                        setEditDraft((d) => ({ ...d, ...patch }))
                      }
                    />
                    <TableCell className="p-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 dark:text-green-400"
                          onClick={submitEdit}
                          aria-label="Save paint"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{p.brand || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.code || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{p.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.type || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_META[p.status].className}
                      >
                        {STATUS_META[p.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(p)}
                          aria-label="Edit paint"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onRemove(p.id)}
                          aria-label="Delete paint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaintStashPanel;
