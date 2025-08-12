import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { RetainerRow } from "@/types/retainers";

interface Props {
  data: RetainerRow[];
  onEdit: (row: RetainerRow) => void;
  onDelete: (row: RetainerRow) => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(n ?? 0);
}

export const RetainersTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Especialidad</TableHead>
            <TableHead className="text-right">Ingreso neto</TableHead>
            <TableHead className="text-right">Redes</TableHead>
            <TableHead className="text-right">Gastos</TableHead>
            <TableHead className="text-right">Margen</TableHead>
            <TableHead className="text-right">Margen %</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => {
            const margin = (r.net_income ?? 0) - (r.total_expenses ?? 0);
            const marginPct = r.net_income ? (margin / r.net_income) * 100 : 0;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.client_name}</TableCell>
                <TableCell>{r.specialty ?? "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.net_income ?? 0))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.social_media_cost ?? 0))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(r.total_expenses ?? 0))}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(margin))}</TableCell>
                <TableCell className="text-right">{marginPct.toFixed(1)}%</TableCell>
                <TableCell>{r.active ? "Sí" : "No"}</TableCell>
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
