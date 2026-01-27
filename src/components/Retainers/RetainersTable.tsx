import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

function getStatusBadgeClass(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-500 border-gray-200';
  
  const statusLower = status.toLowerCase();
  
  // Estados positivos
  if (statusLower.includes('ok') || statusLower.includes('agradecido')) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  
  // Estados de seguimiento
  if (statusLower.includes('seguimiento') || statusLower.includes('esperando')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  
  // Estados de atencion
  if (statusLower.includes('duda') || statusLower.includes('consulta') || statusLower.includes('pendiente')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
  
  // Estados de alerta
  if (statusLower.includes('insatisfecho')) {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }
  
  // Estados criticos
  if (statusLower.includes('enojado') || statusLower.includes('frustrado') || 
      statusLower.includes('amenaza') || statusLower.includes('reclamo')) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

// Mapeo de colores pastel para el fondo de la fila segun estado
function getRowBgClass(status: string | null): string {
  if (!status) return '';
  
  // Buscar por contenido, no coincidencia exacta (los estados pueden tener emojis)
  const statusLower = status.toLowerCase();
  
  // Estados positivos - verde pastel
  if (statusLower.includes('ok') || statusLower.includes('agradecido')) {
    return 'bg-green-50/70';
  }
  
  // Estados de seguimiento - azul pastel
  if (statusLower.includes('seguimiento') || statusLower.includes('esperando')) {
    return 'bg-blue-50/70';
  }
  
  // Estados de atencion - amarillo/ambar pastel
  if (statusLower.includes('duda') || statusLower.includes('consulta') || statusLower.includes('pendiente')) {
    return 'bg-amber-50/70';
  }
  
  // Estados de alerta leve - naranja pastel
  if (statusLower.includes('insatisfecho')) {
    return 'bg-orange-50/70';
  }
  
  // Estados criticos - rojo pastel
  if (statusLower.includes('enojado') || statusLower.includes('frustrado') || 
      statusLower.includes('amenaza') || statusLower.includes('reclamo')) {
    return 'bg-red-50/60';
  }
  
  return '';
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0.5 cursor-help ${getStatusBadgeClass(clientStatus)}`}
                        >
                          {clientStatus || "—"}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {(r as any).client_status_date 
                            ? `Actualizado: ${new Date((r as any).client_status_date).toLocaleDateString('es-PA', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}`
                            : 'Sin fecha de actualización'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right py-2 text-sm">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <span>{formatCurrency(Number(r.net_income ?? 0))}</span>
                          {Number((r as any).upsell_income ?? 0) > 0 && (
                            <span className="text-xs text-green-600 ml-1">
                              +{formatCurrency(Number((r as any).upsell_income))}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p>Base: {formatCurrency(Number((r as any).base_income ?? r.net_income ?? 0))}</p>
                          <p>Upsells: {formatCurrency(Number((r as any).upsell_income ?? 0))}</p>
                          <p className="font-medium border-t pt-1">Total: {formatCurrency(Number(r.net_income ?? 0))}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
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
