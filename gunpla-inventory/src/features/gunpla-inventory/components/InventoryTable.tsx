import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ExternalLink,
  Pencil,
  Settings2,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { GunplaItem } from "../types";
import {
  formatMoney,
  STATUS_OPTIONS,
  type SortKey,
  type SortState,
} from "../lib/inventory";

interface InventoryTableProps {
  items: GunplaItem[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onEdit: (item: GunplaItem) => void;
  onInlineSave: (item: GunplaItem) => void;
  onDelete: (item: GunplaItem) => void;
}

function statusVariant(status: string): "success" | "secondary" | "outline" {
  if (status === "Built") return "success";
  if (status === "In Progress") return "secondary";
  return "outline";
}

const InventoryTable = ({
  items,
  sort,
  onSort,
  onEdit,
  onInlineSave,
  onDelete,
}: InventoryTableProps) => {
  // Inline row editing: one row at a time. `draft` is a full clone of the row
  // being edited, so fields not shown in the table are preserved on save.
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<GunplaItem | null>(null);

  // If the editing row disappears (filter/sort/delete), exit edit mode cleanly.
  useEffect(() => {
    if (editingCode && !items.some((i) => i.code === editingCode)) {
      setEditingCode(null);
      setDraft(null);
    }
  }, [items, editingCode]);

  const startEdit = (item: GunplaItem) => {
    setEditingCode(item.code);
    setDraft({ ...item });
  };
  const cancelEdit = () => {
    setEditingCode(null);
    setDraft(null);
  };
  const saveEdit = () => {
    if (!draft) return;
    if (draft.name.trim() === "") return; // name is required (mirrors the dialog)
    onInlineSave({
      ...draft,
      name: draft.name.trim(),
      grade: draft.grade.trim(),
    });
    setEditingCode(null);
    setDraft(null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const SortHead = ({
    column,
    label,
    className,
    align = "left",
  }: {
    column: SortKey;
    label: string;
    className?: string;
    align?: "left" | "right";
  }) => {
    const active = sort.key === column;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => onSort(column)}
          className={`-mx-1 flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground ${
            active ? "text-foreground" : "text-muted-foreground"
          } ${align === "right" ? "ml-auto flex-row-reverse" : ""}`}
        >
          {label}
          <Icon className="h-3.5 w-3.5 shrink-0" />
        </button>
      </TableHead>
    );
  };

  if (items.length === 0) {
    return (
      <div className="rounded-md border p-10 text-center text-sm text-muted-foreground">
        No kits match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead column="code" label="Code" className="w-[110px]" />
            <SortHead column="name" label="Name" />
            <SortHead column="grade" label="Grade" className="w-[120px]" />
            <SortHead column="status" label="Status" className="w-[110px]" />
            <SortHead
              column="location"
              label="Location"
              className="w-[130px]"
            />
            <SortHead
              column="paid"
              label="Paid"
              className="w-[90px]"
              align="right"
            />
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const editing = editingCode === item.code && draft !== null;

            if (editing && draft) {
              return (
                <TableRow key={item.code}>
                  <TableCell className="font-mono text-xs">
                    {item.code}
                  </TableCell>
                  <TableCell>
                    <Input
                      autoFocus
                      className="h-8"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      onKeyDown={onKeyDown}
                      placeholder="Kit name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      value={draft.grade}
                      onChange={(e) =>
                        setDraft({ ...draft, grade: e.target.value })
                      }
                      onKeyDown={onKeyDown}
                      placeholder="Grade"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={draft.status}
                      onValueChange={(v) => setDraft({ ...draft, status: v })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      value={draft.location}
                      onChange={(e) =>
                        setDraft({ ...draft, location: e.target.value })
                      }
                      onKeyDown={onKeyDown}
                      placeholder="Location"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-8 text-right"
                      value={draft.paid ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const n = Number(v);
                        setDraft({
                          ...draft,
                          paid: v === "" || Number.isNaN(n) ? null : n,
                        });
                      }}
                      onKeyDown={onKeyDown}
                      placeholder="—"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 dark:text-green-400"
                        onClick={saveEdit}
                        aria-label="Save"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={cancelEdit}
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow key={item.code}>
                <TableCell className="font-mono text-xs">{item.code}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>{item.name || "—"}</span>
                    {item.sell && (
                      <Tag
                        className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400"
                        aria-label="For sale"
                      />
                    )}
                    {item.delpiLink && (
                      <a
                        href={item.delpiLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title="Decal link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {item.peebsLimited &&
                    item.peebsLimited.toLowerCase() !== "no" && (
                      <span className="text-xs text-muted-foreground">
                        {item.peebsLimited}
                      </span>
                    )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.grade || item.brand || "—"}
                  </Badge>
                  {item.scale && (
                    <span className="block text-xs text-muted-foreground">
                      {item.scale}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.location || "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatMoney(item.paid)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEdit(item)}
                      aria-label="Edit in row"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(item)}
                      aria-label="Edit all fields"
                      title="Edit all fields"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDelete(item)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryTable;
