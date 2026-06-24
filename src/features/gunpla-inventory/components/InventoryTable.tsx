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
import { ExternalLink, Pencil, Tag, Trash2 } from "lucide-react";
import type { GunplaItem } from "../types";
import { formatMoney } from "../lib/inventory";

interface InventoryTableProps {
  items: GunplaItem[];
  onEdit: (item: GunplaItem) => void;
  onDelete: (item: GunplaItem) => void;
}

function statusVariant(status: string): "success" | "secondary" | "outline" {
  if (status === "Built") return "success";
  if (status === "In Progress") return "secondary";
  return "outline";
}

const InventoryTable = ({ items, onEdit, onDelete }: InventoryTableProps) => {
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
            <TableHead className="w-[110px]">Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[120px]">Grade</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[130px]">Location</TableHead>
            <TableHead className="w-[90px] text-right">Paid</TableHead>
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
