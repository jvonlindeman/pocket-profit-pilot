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

// Mapeo de colores para el badge de estado de cliente
const statusColors: Record<string, string> = {
  'OK': 'bg-green-100 text-green-800 border-green-200',
  'Agradecido': 'bg-green-100 text-green-800 border-green-200',
  'En seguimiento': 'bg-blue-100 text-blue-800 border-blue-200',
  'Esperando respuesta': 'bg-blue-100 text-blue-800 border-blue-200',
  'Duda o consulta': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Con pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Insatisfecho leve': 'bg-orange-100 text-orange-800 border-orange-200',
  'Enojado': 'bg-red-100 text-red-800 border-red-200',
  'Frustrado': 'bg-red-100 text-red-800 border-red-200',
  'Amenaza con irse': 'bg-red-100 text-red-800 border-red-200',
  'Reclamo grave': 'bg-red-100 text-red-800 border-red-200',
};

function getStatusBadgeClass(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-500 border-gray-200';
  return statusColors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
}

// Mapeo de colores pastel para el fondo de la fila segun estado
function getRowBgClass(status: string | null): string {
  if (!status) return '';
  
  const rowColors: Record<string, string> = {
    'OK': 'bg-green-50/70',
    'Agradecido': 'bg-green-50/70',
    'En seguimiento': 'bg-blue-50/70',
    'Esperando respuesta': 'bg-blue-50/70',
    'Duda o consulta': 'bg-amber-50/70',
    'Con pendiente': 'bg-amber-50/70',
    'Insatisfecho leve': 'bg-orange-50/70',
    'Enojado': 'bg-red-50/60',
    'Frustrado': 'bg-red-50/60',
    'Amenaza con irse': 'bg-red-50/60',
    'Reclamo grave': 'bg-red-50/60',
  };
  
  return rowColors[status] || '';
}

export const RetainersTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Cliente</TableHead>
            <TableHead>Espec.</TableHead>
            <TableHead>Estado</TableHead>
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
            
            // Status indicator color
            const getStatusColor = () => {
              if (!r.active) return 'bg-red-500';           // Cancelado/Perdido
              if ((r as any).paused_at) return 'bg-yellow-500'; // Pausado
              return 'bg-green-500';                        // Activo
            };
            
            // Get client status from row (cast to any since types may not be updated yet)
            const clientStatus = (r as any).client_status as string | null;
            
            return (
              <TableRow key={r.id} className={getRowBgClass(clientStatus)}>
                <TableCell className="font-medium py-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor()}`} />
                    <span className="truncate max-w-[120px]">{r.client_name}</span>
                    {r.is_legacy && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">L</Badge>
                    )}
                    {(r as any).paused_at && r.active && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-500 text-yellow-600">P</Badge>
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
                <TableCell className="py-2">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0.5 ${getStatusBadgeClass(clientStatus)}`}
                  >
                    {clientStatus || "—"}
                  </Badge>
                </TableCell>
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
                <TableCell className={`sticky right-0 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] py-2 ${getRowBgClass(clientStatus) || 'bg-background'}`}>
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
