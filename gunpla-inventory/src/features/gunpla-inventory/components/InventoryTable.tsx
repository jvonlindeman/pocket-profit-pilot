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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import type { GunplaItem } from "../types";
import { formatMoney, type SortKey, type SortState } from "../lib/inventory";

interface InventoryTableProps {
  items: GunplaItem[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onEdit: (item: GunplaItem) => void;
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
  onDelete,
}: InventoryTableProps) => {
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
    <div className="rounded-md border">
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
          {items.map((item) => (
            <TableRow key={item.code}>
              <TableCell className="font-mono text-xs">{item.code}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-1.5">
                  <span>{item.name || "—"}</span>
                  {item.sell && (
                    <Tag className="h-3.5 w-3.5 text-purple-600" aria-label="For sale" />
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
                <Badge variant="outline">{item.grade}</Badge>
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
                    onClick={() => onEdit(item)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryTable;
