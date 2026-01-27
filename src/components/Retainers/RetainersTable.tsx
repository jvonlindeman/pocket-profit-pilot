import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RetainerRow } from "@/types/retainers";

interface Props {
  data: RetainerRow[];
  onEdit: (row: RetainerRow) => void;
  onDelete: (row: RetainerRow) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(n ?? 0);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("es-PA", { 
      year: "numeric", 
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
            <TableHead>Cliente</TableHead>
            <TableHead>Especialidad</TableHead>
            <TableHead className="text-right">Ingreso</TableHead>
            <TableHead className="text-center">Stripe</TableHead>
            <TableHead className="text-right">Art/mes</TableHead>
            <TableHead className="text-right">Redes</TableHead>
            <TableHead className="text-right">Gastos</TableHead>
            <TableHead className="text-right">Margen</TableHead>
            <TableHead className="text-right">Margen %</TableHead>
            <TableHead className="text-center">WA Bot</TableHead>
            <TableHead className="text-center">Activo</TableHead>
            <TableHead>Fecha baja</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => {
            const margin = (r.net_income ?? 0) - (r.total_expenses ?? 0);
            const marginPct = r.net_income ? (margin / r.net_income) * 100 : 0;
            const row = r as any;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {r.client_name}
                    {row.is_legacy && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Legacy</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{r.specialty ?? "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.net_income ?? 0))}</TableCell>
                <TableCell className="text-center">{row.uses_stripe ? "Sí" : "No"}</TableCell>
                <TableCell className="text-right">{row.articles_per_month ?? 0}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.social_media_cost ?? 0))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.total_expenses ?? 0))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(margin))}</TableCell>
                <TableCell className="text-right">{marginPct.toFixed(1)}%</TableCell>
                <TableCell className="text-center">{row.has_whatsapp_bot ? "Sí" : "No"}</TableCell>
                <TableCell className="text-center">{r.active ? "Sí" : "No"}</TableCell>
                <TableCell className={r.canceled_at ? "text-destructive" : ""}>
                  {formatDate(r.canceled_at)}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(r)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(r)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
