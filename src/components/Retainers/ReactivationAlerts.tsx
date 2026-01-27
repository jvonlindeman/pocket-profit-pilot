import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";
import { differenceInDays, addDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { RetainerRow } from "@/types/retainers";

interface ReactivationClient extends RetainerRow {
  daysUntil: number;
  isOverdue: boolean;
}

interface Props {
  retainers: RetainerRow[];
  onEdit: (row: RetainerRow) => void;
}

export const ReactivationAlerts: React.FC<Props> = ({ retainers, onEdit }) => {
  const upcomingReactivations = React.useMemo((): ReactivationClient[] => {
    const today = startOfDay(new Date());
    const weekFromNow = addDays(today, 7);

    return retainers
      .filter((r) => {
        // Only paused clients with expected reactivation date
        if (!r.active) return false;
        if (!(r as any).paused_at) return false;
        if (!(r as any).expected_reactivation_date) return false;
        
        const reactivationDate = new Date((r as any).expected_reactivation_date);
        // Show if within 7 days OR overdue
        return reactivationDate <= weekFromNow;
      })
      .map((r) => {
        const reactivationDate = startOfDay(new Date((r as any).expected_reactivation_date));
        const daysUntil = differenceInDays(reactivationDate, today);
        return {
          ...r,
          daysUntil,
          isOverdue: daysUntil < 0,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [retainers]);

  if (upcomingReactivations.length === 0) {
    return null;
  }

  const formatDays = (client: ReactivationClient): string => {
    if (client.isOverdue) {
      return `Vencido hace ${Math.abs(client.daysUntil)} día${Math.abs(client.daysUntil) !== 1 ? 's' : ''}`;
    }
    if (client.daysUntil === 0) {
      return "Hoy";
    }
    return `En ${client.daysUntil} día${client.daysUntil !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('es-PA', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return '-';
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          Clientes a contactar para reactivar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcomingReactivations.map((client) => (
          <div
            key={client.id}
            className={cn(
              "flex items-center justify-between p-2 rounded-md",
              client.isOverdue 
                ? "bg-red-100 dark:bg-red-950/40" 
                : "bg-yellow-100/60 dark:bg-yellow-950/40"
            )}
          >
            <div className="flex items-center gap-2">
              {client.isOverdue && (
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              )}
              <div>
                <span className={cn(
                  "font-medium",
                  client.isOverdue && "text-red-700 dark:text-red-400"
                )}>
                  {client.client_name}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {formatDate((client as any).expected_reactivation_date)} • {formatDays(client)}
                </span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onEdit(client)}
              className="flex-shrink-0"
            >
              Editar
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
