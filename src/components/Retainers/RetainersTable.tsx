import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, MessageSquare, Pencil, Trash2 } from "lucide-react";
import type { RetainerRow } from "@/types/retainers";

interface Props {
  data: RetainerRow[];
  onEdit: (row: RetainerRow) => void;
  onDelete: (row: RetainerRow) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("es-PA", { 
      month: "short", 
      day: "numeric" 
    });
  } catch {
    return "-";
  }
}

export const RetainersTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Cliente</TableHead>
            <TableHead>Espec.</TableHead>
            <TableHead className="text-right">Ingreso</TableHead>
            <TableHead className="text-right">Redes</TableHead>
            <TableHead className="text-right">Gastos</TableHead>
            <TableHead className="text-right">Margen</TableHead>
            <TableHead>Baja</TableHead>
            <TableHead className="sticky right-0 bg-background shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => {
            const margin = (r.net_income ?? 0) - (r.total_expenses ?? 0);
            const marginPct = r.net_income ? (margin / r.net_income) * 100 : 0;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium py-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.active ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="truncate max-w-[120px]">{r.client_name}</span>
                    {r.is_legacy && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">L</Badge>
                    )}
                    {r.uses_stripe && (
                      <CreditCard className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {r.has_whatsapp_bot && (
                      <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-sm">{r.specialty ?? "-"}</TableCell>
                <TableCell className="text-right py-2 text-sm">{formatCurrency(Number(r.net_income ?? 0))}</TableCell>
                <TableCell className="text-right py-2 text-sm">{formatCurrency(Number(r.social_media_cost ?? 0))}</TableCell>
                <TableCell className="text-right py-2 text-sm">{formatCurrency(Number(r.total_expenses ?? 0))}</TableCell>
                <TableCell className="text-right py-2">
                  <div>
                    <div className="text-sm font-medium">{formatCurrency(margin)}</div>
                    <div className="text-xs text-muted-foreground">{marginPct.toFixed(0)}%</div>
                  </div>
                </TableCell>
                <TableCell className={`py-2 text-sm ${r.canceled_at ? "text-destructive" : ""}`}>
                  {formatDate(r.canceled_at)}
                </TableCell>
                <TableCell className="sticky right-0 bg-background shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] py-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(r)}>
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
